"""
Database backup and restore functionality.

Provides automated backups with compression and rotation.
"""

import gzip
import json
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from utils.logging_setup import get_logger
from engine.data_ingestion import get_database

logger = get_logger("backup")


class BackupManager:
    """
    Manages database backups with compression and rotation.

    Features:
    - SQLite database backups
    - JSON data export
    - Gzip compression
    - Automatic rotation (keep N most recent)
    - Restore from backup
    """

    def __init__(
        self,
        backup_dir: str = "backups",
        max_backups: int = 10,
        compress: bool = True
    ):
        """
        Initialize the backup manager.

        Args:
            backup_dir: Directory to store backups
            max_backups: Maximum number of backups to keep
            compress: Whether to compress backups
        """
        self.backup_dir = Path(backup_dir)
        self.max_backups = max_backups
        self.compress = compress

        # Create backup directory
        self.backup_dir.mkdir(parents=True, exist_ok=True)

    def create_backup(self, include_data: bool = True) -> Dict[str, Any]:
        """
        Create a full backup.

        Args:
            include_data: Include JSON data export

        Returns:
            Backup metadata
        """
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        backup_name = f"backup_{timestamp}"
        backup_path = self.backup_dir / backup_name

        # Create backup subdirectory
        backup_path.mkdir(parents=True, exist_ok=True)

        metadata = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'backup_name': backup_name,
            'files': [],
            'compressed': self.compress,
        }

        try:
            # Backup SQLite database
            db = get_database()
            db_source = Path(db.db_path)

            if db_source.exists():
                db_backup = backup_path / "database.db"
                shutil.copy2(db_source, db_backup)

                if self.compress:
                    self._compress_file(db_backup)
                    metadata['files'].append('database.db.gz')
                else:
                    metadata['files'].append('database.db')

                logger.info(f"Database backed up: {db_source}")

            # Export data as JSON
            if include_data:
                self._export_data(backup_path, metadata)

            # Save metadata
            metadata_path = backup_path / "metadata.json"
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            metadata['files'].append('metadata.json')

            # Rotate old backups
            self._rotate_backups()

            logger.info(f"Backup created: {backup_name}")
            return metadata

        except Exception as e:
            logger.error(f"Backup failed: {e}")
            # Cleanup failed backup
            if backup_path.exists():
                shutil.rmtree(backup_path)
            raise

    def _export_data(self, backup_path: Path, metadata: Dict[str, Any]) -> None:
        """Export database data as JSON."""
        db = get_database()

        # Export markets
        markets = db.get_all_markets()
        if markets:
            markets_data = [m.to_dict() if hasattr(m, 'to_dict') else str(m) for m in markets]
            self._write_json(backup_path / "markets.json", markets_data, metadata)

        # Export signals
        signals = db.get_recent_signals(limit=10000) if hasattr(db, 'get_recent_signals') else []
        if signals:
            signals_data = [s.to_dict() if hasattr(s, 'to_dict') else str(s) for s in signals]
            self._write_json(backup_path / "signals.json", signals_data, metadata)

        # Export snapshots (last 1000)
        snapshots = db.get_recent_snapshots(limit=1000) if hasattr(db, 'get_recent_snapshots') else []
        if snapshots:
            snapshots_data = [s.to_dict() if hasattr(s, 'to_dict') else str(s) for s in snapshots]
            self._write_json(backup_path / "snapshots.json", snapshots_data, metadata)

    def _write_json(self, path: Path, data: Any, metadata: Dict[str, Any]) -> None:
        """Write JSON data, optionally compressed."""
        with open(path, 'w') as f:
            json.dump(data, f, indent=2, default=str)

        if self.compress:
            self._compress_file(path)
            metadata['files'].append(path.name + '.gz')
        else:
            metadata['files'].append(path.name)

    def _compress_file(self, path: Path) -> None:
        """Compress a file with gzip and remove original."""
        with open(path, 'rb') as f_in:
            with gzip.open(str(path) + '.gz', 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)
        path.unlink()

    def _decompress_file(self, path: Path) -> Path:
        """Decompress a gzip file."""
        output_path = path.with_suffix('')
        with gzip.open(path, 'rb') as f_in:
            with open(output_path, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)
        return output_path

    def _rotate_backups(self) -> int:
        """Remove old backups exceeding max_backups."""
        backups = self.list_backups()
        removed = 0

        if len(backups) > self.max_backups:
            # Sort by timestamp (oldest first)
            to_remove = sorted(backups, key=lambda b: b['timestamp'])[:len(backups) - self.max_backups]

            for backup in to_remove:
                backup_path = self.backup_dir / backup['name']
                if backup_path.exists():
                    shutil.rmtree(backup_path)
                    logger.info(f"Removed old backup: {backup['name']}")
                    removed += 1

        return removed

    def list_backups(self) -> List[Dict[str, Any]]:
        """
        List all available backups.

        Returns:
            List of backup metadata
        """
        backups = []

        for item in self.backup_dir.iterdir():
            if item.is_dir() and item.name.startswith('backup_'):
                metadata_path = item / 'metadata.json'
                if metadata_path.exists():
                    with open(metadata_path) as f:
                        metadata = json.load(f)
                        metadata['name'] = item.name
                        metadata['path'] = str(item)
                        metadata['size'] = sum(
                            f.stat().st_size for f in item.rglob('*') if f.is_file()
                        )
                        backups.append(metadata)
                else:
                    backups.append({
                        'name': item.name,
                        'path': str(item),
                        'timestamp': None,
                        'files': list(item.iterdir()),
                    })

        return sorted(backups, key=lambda b: b.get('timestamp', ''), reverse=True)

    def restore_backup(self, backup_name: str, restore_db: bool = True) -> Dict[str, Any]:
        """
        Restore from a backup.

        Args:
            backup_name: Name of backup to restore
            restore_db: Whether to restore the database

        Returns:
            Restore result metadata
        """
        backup_path = self.backup_dir / backup_name

        if not backup_path.exists():
            raise FileNotFoundError(f"Backup not found: {backup_name}")

        result = {
            'backup_name': backup_name,
            'restored_at': datetime.now(timezone.utc).isoformat(),
            'files_restored': [],
        }

        try:
            # Load metadata
            metadata_path = backup_path / 'metadata.json'
            if metadata_path.exists():
                with open(metadata_path) as f:
                    metadata = json.load(f)
                result['original_timestamp'] = metadata.get('timestamp')

            # Restore database
            if restore_db:
                db_file = backup_path / 'database.db'
                db_file_gz = backup_path / 'database.db.gz'

                if db_file_gz.exists():
                    db_file = self._decompress_file(db_file_gz)

                if db_file.exists():
                    db = get_database()
                    target_path = Path(db.db_path)

                    # Create backup of current database
                    if target_path.exists():
                        current_backup = target_path.with_suffix('.db.pre_restore')
                        shutil.copy2(target_path, current_backup)
                        logger.info(f"Current database backed up to: {current_backup}")

                    # Restore
                    shutil.copy2(db_file, target_path)
                    result['files_restored'].append('database.db')
                    logger.info(f"Database restored from: {backup_name}")

                    # Clean up decompressed file
                    if db_file_gz.exists() and db_file.exists():
                        db_file.unlink()

            logger.info(f"Restore completed: {backup_name}")
            return result

        except Exception as e:
            logger.error(f"Restore failed: {e}")
            raise

    def get_backup_info(self, backup_name: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a backup.

        Args:
            backup_name: Name of backup

        Returns:
            Backup metadata or None if not found
        """
        backup_path = self.backup_dir / backup_name

        if not backup_path.exists():
            return None

        metadata_path = backup_path / 'metadata.json'
        if metadata_path.exists():
            with open(metadata_path) as f:
                metadata = json.load(f)
        else:
            metadata = {}

        # Calculate size
        total_size = sum(f.stat().st_size for f in backup_path.rglob('*') if f.is_file())

        return {
            'name': backup_name,
            'path': str(backup_path),
            'timestamp': metadata.get('timestamp'),
            'files': metadata.get('files', []),
            'compressed': metadata.get('compressed', False),
            'size_bytes': total_size,
            'size_human': self._format_size(total_size),
        }

    @staticmethod
    def _format_size(size_bytes: int) -> str:
        """Format size in human-readable format."""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024
        return f"{size_bytes:.1f} TB"


# Global backup manager instance
_backup_manager: Optional[BackupManager] = None


def get_backup_manager() -> BackupManager:
    """Get the global backup manager instance."""
    global _backup_manager
    if _backup_manager is None:
        _backup_manager = BackupManager()
    return _backup_manager


def create_backup(**kwargs) -> Dict[str, Any]:
    """Create a backup using the global manager."""
    return get_backup_manager().create_backup(**kwargs)


def restore_backup(backup_name: str, **kwargs) -> Dict[str, Any]:
    """Restore a backup using the global manager."""
    return get_backup_manager().restore_backup(backup_name, **kwargs)


def list_backups() -> List[Dict[str, Any]]:
    """List all backups using the global manager."""
    return get_backup_manager().list_backups()
