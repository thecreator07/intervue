import mongoose from 'mongoose';

type ConnectionObject = {
  isConnected?: number;
};

const connection: ConnectionObject = {};

async function dbConnect(): Promise<void> {
  // Check if we have a connection to the database or if it's currently connecting
  if (connection.isConnected) {
    console.log('Already connected to the database');
    return;
  }

  try {
    // Attempt to connect to the database
    const db = await mongoose.connect(process.env.DB_URL || '', { dbName: "intervue",socketTimeoutMS:60000,serverSelectionTimeoutMS:60000 });

    connection.isConnected = db.connection.readyState;
    // connection.isConnected = db.connections[0].readyState
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);

    process.exit(1);
  }
}

export default dbConnect;