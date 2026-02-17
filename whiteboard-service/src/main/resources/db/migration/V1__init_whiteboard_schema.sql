-- Create whiteboard schema
CREATE SCHEMA IF NOT EXISTS whiteboard;

-- Boards table
CREATE TABLE IF NOT EXISTS whiteboard.boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL, -- References users.id from auth service (shared DB)
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on owner_id for faster queries
CREATE INDEX IF NOT EXISTS idx_boards_owner_id ON whiteboard.boards(owner_id);
CREATE INDEX IF NOT EXISTS idx_boards_created_at ON whiteboard.boards(created_at DESC);

-- Board collaborators table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS whiteboard.board_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES whiteboard.boards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- References users.id from auth service
    role VARCHAR(20) NOT NULL DEFAULT 'VIEWER', -- OWNER, EDITOR, VIEWER
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(board_id, user_id)
);

-- Create indexes for board_collaborators
CREATE INDEX IF NOT EXISTS idx_board_collaborators_board_id ON whiteboard.board_collaborators(board_id);
CREATE INDEX IF NOT EXISTS idx_board_collaborators_user_id ON whiteboard.board_collaborators(user_id);

-- Shapes table (canvas elements)
CREATE TABLE IF NOT EXISTS whiteboard.shapes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES whiteboard.boards(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- PEN, RECTANGLE, CIRCLE, TEXT, STICKY_NOTE, ARROW, LINE
    data JSONB NOT NULL, -- Flexible JSON structure for shape properties
    layer_order INTEGER NOT NULL DEFAULT 0,
    created_by UUID, -- References users.id from auth service
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for shapes
CREATE INDEX IF NOT EXISTS idx_shapes_board_id ON whiteboard.shapes(board_id);
CREATE INDEX IF NOT EXISTS idx_shapes_board_layer ON whiteboard.shapes(board_id, layer_order);
CREATE INDEX IF NOT EXISTS idx_shapes_type ON whiteboard.shapes(type);
CREATE INDEX IF NOT EXISTS idx_shapes_created_at ON whiteboard.shapes(created_at DESC);

-- Board snapshots table (for version history - optional feature)
CREATE TABLE IF NOT EXISTS whiteboard.board_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES whiteboard.boards(id) ON DELETE CASCADE,
    snapshot_data JSONB NOT NULL, -- Full board state at snapshot time
    created_by UUID, -- References users.id from auth service
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for board_snapshots
CREATE INDEX IF NOT EXISTS idx_board_snapshots_board_id ON whiteboard.board_snapshots(board_id);
CREATE INDEX IF NOT EXISTS idx_board_snapshots_created_at ON whiteboard.board_snapshots(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION whiteboard.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at for boards
CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON whiteboard.boards
    FOR EACH ROW EXECUTE FUNCTION whiteboard.update_updated_at_column();

-- Trigger to automatically update updated_at for shapes
CREATE TRIGGER update_shapes_updated_at BEFORE UPDATE ON whiteboard.shapes
    FOR EACH ROW EXECUTE FUNCTION whiteboard.update_updated_at_column();
