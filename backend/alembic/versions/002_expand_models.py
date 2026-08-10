"""expand models with finding_status audit_log and new vuln columns

Revision ID: 002
Revises: 001
Create Date: 2026-08-10 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # -- Extend ScanStatus enum with new values --
    # For PostgreSQL, add new enum values
    for val in ('queued', 'static_scan', 'dependency_scan', 'container_scan',
                'dynamic_scan', 'network_scan', 'normalizing'):
        op.execute(f"ALTER TYPE scanstatus ADD VALUE IF NOT EXISTS '{val}'")

    # -- Extend UserRole enum --
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'security_analyst'")

    # -- Add VulnerabilitySeverity.INFO --
    op.execute("ALTER TYPE vulnerabilityseverity ADD VALUE IF NOT EXISTS 'info'")

    # -- Create FindingStatus enum --
    op.execute("CREATE TYPE findingstatus AS ENUM ('open', 'confirmed', 'false_positive', 'ignored', 'fixed')")

    # -- Add new columns to vulnerability table --
    op.add_column('vulnerability', sa.Column('rule_id', sa.String(255), nullable=True))
    op.add_column('vulnerability', sa.Column('cwe_id', sa.String(20), nullable=True))
    op.add_column('vulnerability', sa.Column('owasp_category', sa.String(100), nullable=True))
    op.add_column('vulnerability', sa.Column('cvss_score', sa.Float(), nullable=True))
    op.add_column('vulnerability', sa.Column('file_path', sa.String(500), nullable=True))
    op.add_column('vulnerability', sa.Column('line_number', sa.Integer(), nullable=True))
    op.add_column('vulnerability', sa.Column('column_number', sa.Integer(), nullable=True))
    op.add_column('vulnerability', sa.Column('confidence', sa.String(20), nullable=True))
    op.add_column('vulnerability', sa.Column('impact', sa.String(20), nullable=True))
    op.add_column('vulnerability', sa.Column('scanner_name', sa.String(50), nullable=True))
    op.add_column('vulnerability', sa.Column(
        'finding_status',
        sa.Enum('open', 'confirmed', 'false_positive', 'ignored', 'fixed', name='findingstatus'),
        nullable=True,
        server_default='open'
    ))

    # -- Create AuditLog table --
    op.create_table(
        'auditlog',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('resource_type', sa.String(50), nullable=False),
        sa.Column('resource_id', sa.String(100), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('auditlog')

    op.drop_column('vulnerability', 'finding_status')
    op.drop_column('vulnerability', 'scanner_name')
    op.drop_column('vulnerability', 'impact')
    op.drop_column('vulnerability', 'confidence')
    op.drop_column('vulnerability', 'column_number')
    op.drop_column('vulnerability', 'line_number')
    op.drop_column('vulnerability', 'file_path')
    op.drop_column('vulnerability', 'cvss_score')
    op.drop_column('vulnerability', 'owasp_category')
    op.drop_column('vulnerability', 'cwe_id')
    op.drop_column('vulnerability', 'rule_id')

    op.execute('DROP TYPE findingstatus')
