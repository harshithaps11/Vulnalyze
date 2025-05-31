"""initial migration

Revision ID: 001
Revises: 
Create Date: 2024-02-17 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create enum types
    op.execute("CREATE TYPE userrole AS ENUM ('admin', 'user')")
    op.execute("CREATE TYPE scanstatus AS ENUM ('pending', 'running', 'completed', 'failed')")
    op.execute("CREATE TYPE vulnerabilityseverity AS ENUM ('low', 'medium', 'high', 'critical')")

    # Create organization table
    op.create_table(
        'organization',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create user table
    op.create_table(
        'user',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('role', postgresql.ENUM('admin', 'user', name='userrole'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organization.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_user_email'), 'user', ['email'], unique=True)

    # Create scan table
    op.create_table(
        'scan',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('uuid', postgresql.UUID(), nullable=False),
        sa.Column('status', postgresql.ENUM('pending', 'running', 'completed', 'failed', name='scanstatus'), nullable=False),
        sa.Column('target_url', sa.String(length=255), nullable=False),
        sa.Column('source_code', sa.Text(), nullable=True),
        sa.Column('scan_type', sa.String(length=50), nullable=False),
        sa.Column('results', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organization.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('uuid')
    )
    op.create_index(op.f('ix_scan_uuid'), 'scan', ['uuid'], unique=True)

    # Create vulnerability table
    op.create_table(
        'vulnerability',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('scan_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('severity', postgresql.ENUM('low', 'medium', 'high', 'critical', name='vulnerabilityseverity'), nullable=False),
        sa.Column('location', sa.String(length=255), nullable=False),
        sa.Column('evidence', sa.Text(), nullable=True),
        sa.Column('is_false_positive', sa.Boolean(), nullable=False),
        sa.Column('false_positive_reason', sa.Text(), nullable=True),
        sa.Column('remediation', sa.Text(), nullable=True),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['scan_id'], ['scan.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('vulnerability')
    op.drop_index(op.f('ix_scan_uuid'), table_name='scan')
    op.drop_table('scan')
    op.drop_index(op.f('ix_user_email'), table_name='user')
    op.drop_table('user')
    op.drop_table('organization')
    op.execute('DROP TYPE vulnerabilityseverity')
    op.execute('DROP TYPE scanstatus')
    op.execute('DROP TYPE userrole') 