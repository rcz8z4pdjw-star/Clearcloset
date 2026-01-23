"""
Database Management Utilities.

Provides tools for:
- Database maintenance and cleanup
- Data export and import
- Statistics and health checks
- Backup and restore
"""

import sqlite3
import json
import csv
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import shutil

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from utils.logging_setup import get_logger
from utils.config_loader import get_config

logger = get_logger("db_utils")


@dataclass
class DatabaseStats:
    """Statistics about the database."""
    total_size_bytes: int
    total_size_mb: float
    table_counts: Dict[str, int]
    oldest_snapshot: Optional[datetime]
    newest_snapshot: Optional[datetime]
    total_markets: int
    total_signals: int
    total_snapshots: int


@dataclass
class CleanupResult:
    """Result of a cleanup operation."""
    rows_deleted: int
    space_freed_bytes: int
    duration_seconds: float
    tables_affected: List[str]


class DatabaseManager:
    """
    Database management utilities.

    Features:
    - Health checks and statistics
    - Data cleanup and archival
    - Export and import
    - Backup and restore
    """

    def __init__(self, db_path: Optional[str] = None):
        """
        Initialize database manager.

        Args:
            db_path: Path to database file
        """
        if db_path:
            self.db_path = Path(db_path)
        else:
            self.db_path = Path(get_config(
                'database.path',
                'data/markets.db'
            ))

        self.backup_dir = Path(get_config(
            'database.backup_dir',
            'data/backups'
        ))

    def get_stats(self) -> DatabaseStats:
        """
        Get database statistics.

        Returns:
            DatabaseStats with current statistics
        """
        if not self.db_path.exists():
            return DatabaseStats(
                total_size_bytes=0,
                total_size_mb=0,
                table_counts={},
                oldest_snapshot=None,
                newest_snapshot=None,
                total_markets=0,
                total_signals=0,
                total_snapshots=0
            )

        size_bytes = self.db_path.stat().st_size
        size_mb = size_bytes / (1024 * 1024)

        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()

        # Get table counts
        cursor.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
        """)
        tables = [row[0] for row in cursor.fetchall()]

        table_counts = {}
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            table_counts[table] = cursor.fetchone()[0]

        # Get snapshot date range
        oldest = None
        newest = None
        total_snapshots = 0

        if 'market_snapshots' in tables:
            cursor.execute("SELECT MIN(timestamp), MAX(timestamp), COUNT(*) FROM market_snapshots")
            row = cursor.fetchone()
            if row[0]:
                oldest = datetime.fromisoformat(row[0])
            if row[1]:
                newest = datetime.fromisoformat(row[1])
            total_snapshots = row[2] or 0

        # Get unique markets count
        total_markets = 0
        if 'market_snapshots' in tables:
            cursor.execute("SELECT COUNT(DISTINCT market_id) FROM market_snapshots")
            total_markets = cursor.fetchone()[0] or 0

        # Get signals count
        total_signals = table_counts.get('signals', 0)

        conn.close()

        return DatabaseStats(
            total_size_bytes=size_bytes,
            total_size_mb=size_mb,
            table_counts=table_counts,
            oldest_snapshot=oldest,
            newest_snapshot=newest,
            total_markets=total_markets,
            total_signals=total_signals,
            total_snapshots=total_snapshots
        )

    def cleanup_old_data(
        self,
        days_to_keep: int = 30,
        vacuum: bool = True
    ) -> CleanupResult:
        """
        Remove data older than specified days.

        Args:
            days_to_keep: Number of days of data to retain
            vacuum: Run VACUUM after cleanup

        Returns:
            CleanupResult with operation details
        """
        start_time = datetime.utcnow()
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        cutoff_str = cutoff_date.isoformat()

        # Get initial size
        initial_size = self.db_path.stat().st_size if self.db_path.exists() else 0

        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()

        total_deleted = 0
        tables_affected = []

        # Clean up snapshots
        cursor.execute(
            "DELETE FROM market_snapshots WHERE timestamp < ?",
            (cutoff_str,)
        )
        if cursor.rowcount > 0:
            total_deleted += cursor.rowcount
            tables_affected.append('market_snapshots')
            logger.info(f"Deleted {cursor.rowcount} old snapshots")

        # Clean up signals
        cursor.execute(
            "DELETE FROM signals WHERE timestamp < ?",
            (cutoff_str,)
        )
        if cursor.rowcount > 0:
            total_deleted += cursor.rowcount
            tables_affected.append('signals')
            logger.info(f"Deleted {cursor.rowcount} old signals")

        # Clean up order books
        cursor.execute(
            "DELETE FROM order_books WHERE timestamp < ?",
            (cutoff_str,)
        )
        if cursor.rowcount > 0:
            total_deleted += cursor.rowcount
            tables_affected.append('order_books')
            logger.info(f"Deleted {cursor.rowcount} old order books")

        conn.commit()

        # Vacuum to reclaim space
        if vacuum:
            logger.info("Running VACUUM...")
            cursor.execute("VACUUM")

        conn.close()

        # Calculate space freed
        final_size = self.db_path.stat().st_size
        space_freed = initial_size - final_size

        duration = (datetime.utcnow() - start_time).total_seconds()

        result = CleanupResult(
            rows_deleted=total_deleted,
            space_freed_bytes=max(0, space_freed),
            duration_seconds=duration,
            tables_affected=tables_affected
        )

        logger.info(
            f"Cleanup complete: {total_deleted} rows deleted, "
            f"{space_freed / 1024 / 1024:.2f} MB freed"
        )

        return result

    def create_backup(self, backup_name: Optional[str] = None) -> str:
        """
        Create a database backup.

        Args:
            backup_name: Custom backup filename

        Returns:
            Path to backup file
        """
        self.backup_dir.mkdir(parents=True, exist_ok=True)

        if backup_name is None:
            backup_name = f"markets_backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.db"

        backup_path = self.backup_dir / backup_name

        # Use SQLite backup API
        conn = sqlite3.connect(str(self.db_path))
        backup_conn = sqlite3.connect(str(backup_path))

        conn.backup(backup_conn)

        backup_conn.close()
        conn.close()

        logger.info(f"Database backed up to: {backup_path}")
        return str(backup_path)

    def restore_backup(self, backup_path: str) -> bool:
        """
        Restore database from backup.

        Args:
            backup_path: Path to backup file

        Returns:
            True if successful
        """
        backup = Path(backup_path)
        if not backup.exists():
            logger.error(f"Backup file not found: {backup_path}")
            return False

        # Create safety backup of current database
        if self.db_path.exists():
            safety_backup = self.backup_dir / f"pre_restore_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.db"
            self.backup_dir.mkdir(parents=True, exist_ok=True)
            shutil.copy(str(self.db_path), str(safety_backup))
            logger.info(f"Safety backup created: {safety_backup}")

        # Restore
        shutil.copy(str(backup), str(self.db_path))
        logger.info(f"Database restored from: {backup_path}")

        return True

    def export_to_csv(
        self,
        output_dir: str,
        tables: Optional[List[str]] = None
    ) -> Dict[str, str]:
        """
        Export database tables to CSV files.

        Args:
            output_dir: Directory for CSV files
            tables: Specific tables to export (all if None)

        Returns:
            Dictionary of table -> file path
        """
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()

        # Get table list
        if tables is None:
            cursor.execute("""
                SELECT name FROM sqlite_master
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
            """)
            tables = [row[0] for row in cursor.fetchall()]

        exported = {}

        for table in tables:
            csv_path = output_path / f"{table}.csv"

            cursor.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()

            # Get column names
            columns = [desc[0] for desc in cursor.description]

            with open(csv_path, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(columns)
                writer.writerows(rows)

            exported[table] = str(csv_path)
            logger.info(f"Exported {len(rows)} rows from {table} to {csv_path}")

        conn.close()

        return exported

    def export_to_json(
        self,
        output_file: str,
        tables: Optional[List[str]] = None
    ) -> str:
        """
        Export database to JSON file.

        Args:
            output_file: Output JSON file path
            tables: Specific tables to export

        Returns:
            Path to exported file
        """
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Get table list
        if tables is None:
            cursor.execute("""
                SELECT name FROM sqlite_master
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
            """)
            tables = [row[0] for row in cursor.fetchall()]

        data = {}

        for table in tables:
            cursor.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()
            data[table] = [dict(row) for row in rows]

        conn.close()

        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2, default=str)

        logger.info(f"Exported database to {output_path}")
        return str(output_path)

    def import_from_json(
        self,
        input_file: str,
        merge: bool = True
    ) -> Dict[str, int]:
        """
        Import data from JSON file.

        Args:
            input_file: Input JSON file path
            merge: Merge with existing data (True) or replace (False)

        Returns:
            Dictionary of table -> rows imported
        """
        with open(input_file) as f:
            data = json.load(f)

        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()

        imported = {}

        for table, rows in data.items():
            if not rows:
                continue

            if not merge:
                cursor.execute(f"DELETE FROM {table}")

            columns = list(rows[0].keys())
            placeholders = ', '.join(['?'] * len(columns))
            column_names = ', '.join(columns)

            for row in rows:
                values = [row[col] for col in columns]
                try:
                    cursor.execute(
                        f"INSERT OR IGNORE INTO {table} ({column_names}) VALUES ({placeholders})",
                        values
                    )
                except Exception as e:
                    logger.warning(f"Failed to import row in {table}: {e}")

            imported[table] = len(rows)
            logger.info(f"Imported {len(rows)} rows into {table}")

        conn.commit()
        conn.close()

        return imported

    def optimize(self):
        """Run optimization operations on database."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()

        # Analyze for query optimization
        logger.info("Running ANALYZE...")
        cursor.execute("ANALYZE")

        # Reindex
        logger.info("Reindexing...")
        cursor.execute("REINDEX")

        # Vacuum
        logger.info("Running VACUUM...")
        cursor.execute("VACUUM")

        conn.close()
        logger.info("Database optimization complete")

    def check_integrity(self) -> Tuple[bool, List[str]]:
        """
        Check database integrity.

        Returns:
            Tuple of (is_valid, list of issues)
        """
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()

        cursor.execute("PRAGMA integrity_check")
        results = cursor.fetchall()

        conn.close()

        if len(results) == 1 and results[0][0] == 'ok':
            logger.info("Database integrity check passed")
            return True, []
        else:
            issues = [row[0] for row in results]
            logger.warning(f"Database integrity issues: {issues}")
            return False, issues

    def get_table_info(self, table: str) -> Dict[str, Any]:
        """
        Get detailed information about a table.

        Args:
            table: Table name

        Returns:
            Dictionary with table information
        """
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()

        # Get schema
        cursor.execute(f"PRAGMA table_info({table})")
        columns = cursor.fetchall()

        # Get row count
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        row_count = cursor.fetchone()[0]

        # Get indexes
        cursor.execute(f"PRAGMA index_list({table})")
        indexes = cursor.fetchall()

        conn.close()

        return {
            'table': table,
            'columns': [
                {
                    'id': col[0],
                    'name': col[1],
                    'type': col[2],
                    'not_null': bool(col[3]),
                    'default': col[4],
                    'primary_key': bool(col[5])
                }
                for col in columns
            ],
            'row_count': row_count,
            'indexes': [
                {'name': idx[1], 'unique': bool(idx[2])}
                for idx in indexes
            ]
        }

    def list_backups(self) -> List[Dict[str, Any]]:
        """
        List available backups.

        Returns:
            List of backup information
        """
        if not self.backup_dir.exists():
            return []

        backups = []
        for f in self.backup_dir.glob('*.db'):
            stat = f.stat()
            backups.append({
                'filename': f.name,
                'path': str(f),
                'size_mb': stat.st_size / (1024 * 1024),
                'created': datetime.fromtimestamp(stat.st_mtime).isoformat()
            })

        return sorted(backups, key=lambda x: x['created'], reverse=True)

    def delete_old_backups(self, keep_count: int = 5) -> int:
        """
        Delete old backups, keeping the most recent.

        Args:
            keep_count: Number of backups to keep

        Returns:
            Number of backups deleted
        """
        backups = self.list_backups()

        if len(backups) <= keep_count:
            return 0

        deleted = 0
        for backup in backups[keep_count:]:
            Path(backup['path']).unlink()
            deleted += 1
            logger.info(f"Deleted old backup: {backup['filename']}")

        return deleted


def print_db_status():
    """Print database status to console."""
    manager = DatabaseManager()
    stats = manager.get_stats()

    print("\n" + "=" * 60)
    print("DATABASE STATUS")
    print("=" * 60)
    print(f"Size: {stats.total_size_mb:.2f} MB")
    print(f"Total Markets: {stats.total_markets}")
    print(f"Total Snapshots: {stats.total_snapshots}")
    print(f"Total Signals: {stats.total_signals}")

    if stats.oldest_snapshot:
        print(f"Data Range: {stats.oldest_snapshot.date()} to {stats.newest_snapshot.date()}")

    print("\nTable Counts:")
    for table, count in stats.table_counts.items():
        print(f"  {table}: {count:,}")

    print("=" * 60 + "\n")
