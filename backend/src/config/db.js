const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Se DB_SSL estiver ativo no .env, configuramos o SSL do PostgreSQL
const sslConfig = process.env.DB_SSL === 'true' 
  ? { rejectUnauthorized: false } 
  : false;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: sslConfig,
});

pool.on('connect', () => {
  console.log('Banco de dados PostgreSQL conectado com sucesso!');
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool do PostgreSQL:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
