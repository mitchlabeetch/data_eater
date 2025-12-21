import { create } from 'zustand';
import { initDuckDB, ingestCSV, query } from '../services/duckdb';
import { useMascotStore } from './mascotStore';
import { useErrorStore } from './errorStore';
import { MASCOT_STATES } from '../lib/constants';

interface Column {
  name: string;
  type: string;
}

interface FileMeta {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

interface ColumnStats {
  nullCount: number;
  distinctCount?: number;
  min?: number | string;
  max?: number | string;
  sum?: number;
  avg?: number;
  topValues?: { value: string; count: number }[];
}

interface DataStore {
  isReady: boolean;
  isLoading: boolean;
  fileMeta: FileMeta | null;
  columns: Column[];
  rows: any[];
  rowCount: number;
  
  selectedColumn: string | null;
  columnStats: ColumnStats | null;
  
  // Diff State
  diffReport: {
    added: number;
    removed: number;
    rowsAdded: any[];
    rowsRemoved: any[];
  } | null;

  initializeEngine: () => Promise<void>;
  loadFile: (file: File) => Promise<void>;
  loadComparisonFile: (file: File) => Promise<void>;
  runQuery: (sql: string) => Promise<void>;
  executeMutation: (sql: string) => Promise<void>;
  selectColumn: (colName: string | null) => Promise<void>;
  fetchRows: (limit?: number) => Promise<any[]>;
  clearDiff: () => void;
  prepareForCloud: (hiddenCols: string[]) => Promise<any[]>;
  reconcileCloud: (processedData: any[]) => Promise<void>;
}

const classifyError = (e: any): string => {
  const msg = String(e).toLowerCase();
  if (msg.includes("syntax error") || msg.includes("parser error")) return "DB_001";
  if (msg.includes("table") && msg.includes("not found")) return "DB_002";
  if (msg.includes("mismatch") || msg.includes("type")) return "DB_003";
  if (msg.includes("fetch") || msg.includes("network")) return "NET_001";
  if (msg.includes("file") || msg.includes("permission")) return "IO_001";
  return "UNKNOWN";
};

export const useDataStore = create<DataStore>((set, get) => ({
  isReady: false,
  isLoading: false,
  fileMeta: null,
  columns: [],
  rows: [],
  rowCount: 0,
  selectedColumn: null,
  columnStats: null,
  diffReport: null,

  initializeEngine: async () => {
    try {
      await initDuckDB();
      set({ isReady: true });
    } catch (e) {
      console.error("Failed to start Glouton Engine", e);
    }
  },

  loadFile: async (file: File) => {
    const mascot = useMascotStore.getState();
    set({ isLoading: true });
    
    mascot.setMascot(MASCOT_STATES.EATING, `Analyse de ${file.name}...`);

    try {
      await initDuckDB();
      const result = await ingestCSV(file);
      
      if (!result) throw new Error("Ingestion failed");

      const initialData = await query(`SELECT * FROM ${result.tableName} LIMIT 100`);
      
      set({
        fileMeta: {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        },
        columns: result.columns,
        rowCount: result.rowCount,
        rows: initialData,
        isLoading: false,
        selectedColumn: null,
        columnStats: null,
        diffReport: null
      });

      mascot.setMascot(MASCOT_STATES.SLEEPING, `Prêt ! ${result.rowCount} lignes chargées.`);
    
    } catch (error) {
      const code = classifyError(error);
      useErrorStore.getState().reportError(code, error);
      set({ isLoading: false });
    }
  },

  loadComparisonFile: async (file: File) => {
     const mascot = useMascotStore.getState();
     set({ isLoading: true });
     mascot.setMascot(MASCOT_STATES.DETECTIVE, `Comparaison avec ${file.name}...`);
 
     try {
       const { conn } = await initDuckDB();
       if (!conn) throw new Error("DB not ready");
 
       await conn.query(`DROP TABLE IF EXISTS comparison_dataset`);
       
       const { db } = await initDuckDB();
       if (db) await db.registerFileHandle('comparison_file', file, 4, true);
       
       await conn.query(`CREATE TABLE comparison_dataset AS SELECT * FROM read_csv_auto('comparison_file')`);
 
       const addedRes = await query(`SELECT * FROM comparison_dataset EXCEPT SELECT * FROM current_dataset`);
       const removedRes = await query(`SELECT * FROM current_dataset EXCEPT SELECT * FROM comparison_dataset`);
 
       set({
         diffReport: {
           added: addedRes.length,
           removed: removedRes.length,
           rowsAdded: addedRes,
           rowsRemoved: removedRes
         },
         isLoading: false
       });
 
       mascot.setMascot(MASCOT_STATES.DETECTIVE, `Différence trouvée : +${addedRes.length} / -${removedRes.length}`);
 
     } catch (e) {
       const code = classifyError(e);
       useErrorStore.getState().reportError(code, e);
       set({ isLoading: false });
     }
  },

  clearDiff: () => set({ diffReport: null }),

  runQuery: async (sql: string) => {
    set({ isLoading: true });
    try {
      const results = await query(sql);
      set({ rows: results, isLoading: false });
    } catch (e) {
      const code = classifyError(e);
      useErrorStore.getState().reportError(code, e);
      set({ isLoading: false });
    }
  },

  executeMutation: async (sql: string) => {
    const mascot = useMascotStore.getState();
    set({ isLoading: true });
    mascot.setMascot(MASCOT_STATES.EATING, "Application des changements...");

    try {
      await query(sql);
      
      const currentRows = await query(`SELECT * FROM current_dataset LIMIT 100`);
      
      const state = get();
      if (state.selectedColumn) {
         await state.selectColumn(state.selectedColumn);
      }

      set({ rows: currentRows, isLoading: false });
      mascot.setMascot(MASCOT_STATES.SLEEPING, "Modification terminée !");
    
    } catch (e) {
      const code = classifyError(e);
      useErrorStore.getState().reportError(code, e);
      set({ isLoading: false });
    }
  },

  selectColumn: async (colName: string | null) => {
    if (!colName) {
      set({ selectedColumn: null, columnStats: null });
      return;
    }

    const state = get();
    if (state.selectedColumn === colName && state.columnStats) return;

    set({ selectedColumn: colName, isLoading: true });
    
    try {
      const safeCol = `"${colName}"`;
      const basicSql = `
        SELECT 
          COUNT(*) - COUNT(${safeCol}) as null_count,
          COUNT(DISTINCT ${safeCol}) as distinct_count,
          MIN(${safeCol}) as min_val,
          MAX(${safeCol}) as max_val
        FROM current_dataset
      `;
      const basicRes = await query(basicSql);
      const stats = basicRes[0];

      const colDef = state.columns.find(c => c.name === colName);
      let extendedStats: Partial<ColumnStats> = {};

      if (colDef?.type === 'DOUBLE' || colDef?.type === 'BIGINT' || colDef?.type === 'INTEGER') {
        const numSql = `SELECT SUM(${safeCol}) as sum_val, AVG(${safeCol}) as avg_val FROM current_dataset`;
        const numRes = await query(numSql);
        extendedStats = {
          sum: numRes[0].sum_val,
          avg: numRes[0].avg_val
        };
      } else {
        const topSql = `
          SELECT ${safeCol} as val, COUNT(*) as cnt 
          FROM current_dataset 
          WHERE ${safeCol} IS NOT NULL
          GROUP BY ${safeCol} 
          ORDER BY cnt DESC 
          LIMIT 5
        `;
        const topRes = await query(topSql);
        extendedStats = {
          topValues: topRes.map((r: any) => ({ value: String(r.val), count: Number(r.cnt) }))
        };
      }

      set({ 
        isLoading: false,
        columnStats: {
          nullCount: Number(stats.null_count),
          distinctCount: Number(stats.distinct_count),
          min: stats.min_val,
          max: stats.max_val,
          ...extendedStats
        }
      });

    } catch (e) {
      useErrorStore.getState().reportError(classifyError(e), e);
      set({ isLoading: false });
    }
  },

  fetchRows: async (limit = 1000) => {
    try {
      const results = await query(`SELECT * FROM current_dataset LIMIT ${limit}`);
      return results;
    } catch (e) {
      useErrorStore.getState().reportError(classifyError(e), e);
      return [];
    }
  },

  prepareForCloud: async (hiddenCols: string[]) => {
    try {
      // 1. Add ID to main table
      await query(`ALTER TABLE current_dataset ADD COLUMN IF NOT EXISTS data_eater_id INTEGER`);
      await query(`UPDATE current_dataset SET data_eater_id = rowid`);

      // 2. Create Staging Table
      await query(`DROP TABLE IF EXISTS cloud_staging`);
      await query(`CREATE TABLE cloud_staging AS SELECT * FROM current_dataset`);

      // 3. Drop Hidden Columns in Staging
      for (const col of hiddenCols) {
        await query(`ALTER TABLE cloud_staging DROP COLUMN IF EXISTS "${col}"`);
      }

      // 4. Return data for export (JSON)
      const exportData = await query(`SELECT * FROM cloud_staging`);
      return exportData;

    } catch (e) {
      useErrorStore.getState().reportError(classifyError(e), e);
      throw e;
    }
  },

  reconcileCloud: async (processedData: any[]) => {
    try {
      const { db, conn } = await initDuckDB();
      if (!db || !conn) return;

      const jsonContent = JSON.stringify(processedData);
      await db.registerFileText('cloud_response.json', jsonContent);
      
      await query(`DROP TABLE IF EXISTS cloud_incoming`);
      await query(`CREATE TABLE cloud_incoming AS SELECT * FROM read_json_auto('cloud_response.json')`);

      const schema = await query(`PRAGMA table_info('cloud_incoming')`);
      const colsToUpdate = schema
        .map((c: any) => c.name)
        .filter((c: string) => c !== 'data_eater_id');

      const setClause = colsToUpdate.map((col: string) => `"${col}" = cloud_incoming."${col}"`).join(', ');
      
      await query(`
        UPDATE current_dataset 
        SET ${setClause} 
        FROM cloud_incoming 
        WHERE current_dataset.data_eater_id = cloud_incoming.data_eater_id
      `);

      await query(`ALTER TABLE current_dataset DROP COLUMN data_eater_id`);
      await query(`DROP TABLE cloud_staging`);
      await query(`DROP TABLE cloud_incoming`);
      
      const currentRows = await query(`SELECT * FROM current_dataset LIMIT 100`);
      set({ rows: currentRows });

    } catch (e) {
      useErrorStore.getState().reportError(classifyError(e), e);
      throw e;
    }
  }
}));