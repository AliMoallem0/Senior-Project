-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create simulation_results table
CREATE TABLE IF NOT EXISTS simulation_results (
    id BIGSERIAL PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    city_name VARCHAR(255) NOT NULL,
    parameters JSONB NOT NULL,
    results JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_simulation_results_project ON simulation_results(project_id);
CREATE INDEX IF NOT EXISTS idx_simulation_results_user ON simulation_results(user_id); 