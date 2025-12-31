import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the server folder next to this module
dotenv.config({ path: path.resolve(__dirname, '.env') });

// temples_images is at repo root: ../temples_images relative to server/
const IMAGES_DIR = path.resolve(__dirname, '..', 'temples_images');

export async function persistTempleImages() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn('⚠️ MONGODB_URI not set — skipping image persistence');
    return { inserted: 0, skipped: 0, temples: {} };
  }

  const dbName = process.env.MONGODB_DB || process.env.DB_NAME || 'templetrip';
  const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });

  try {
    await client.connect();
    const db = client.db(dbName);
    const coll = db.collection('temple_images');

    if (!fs.existsSync(IMAGES_DIR)) {
      console.info('ℹ️ temples_images folder not found — skipping persistence');
      return { inserted: 0, skipped: 0, temples: {} };
    }

    let inserted = 0;
    let skipped = 0;
    const templeImagesMap = {}; // Track all images per temple

    const templeFolders = fs.readdirSync(IMAGES_DIR, { withFileTypes: true }).filter(d => d.isDirectory());

    for (const folderEnt of templeFolders) {
      const folderName = folderEnt.name;
      const folderPath = path.join(IMAGES_DIR, folderName);
      const files = fs.readdirSync(folderPath)
        .filter(f => f.match(/\.(jpe?g|png|webp)$/i))
        .sort((a, b) => {
          // Sort by number (1.jpg, 2.jpg, etc.)
          const numA = parseInt(a.match(/\d+/)?.[0] || '999');
          const numB = parseInt(b.match(/\d+/)?.[0] || '999');
          return numA - numB;
        });

      templeImagesMap[folderName] = [];

      for (const fname of files) {
        const relPath = `/temples/${folderName}/${fname}`; // URL path for frontend
        const fsPath = path.join(folderPath, fname);

        // Skip empty or missing files
        try {
          const stat = fs.statSync(fsPath);
          if (!stat || stat.size === 0) {
            skipped++;
            continue;
          }

          const doc = {
            temple_key: folderName,
            file_name: fname,
            file_path: relPath,
            local_path: fsPath,
            file_size: stat.size,
            added_at: new Date()
          };

          try {
            await coll.updateOne({ file_path: relPath }, { $set: doc }, { upsert: true });
            inserted++;
            templeImagesMap[folderName].push({
              url: relPath,
              fileName: fname,
              size: stat.size
            });
          } catch (err) {
            console.warn(`⚠️ Failed to upsert ${relPath}: ${err.message}`);
          }
        } catch (err) {
          skipped++;
          continue;
        }
      }
    }

    // Update Temple.imageUrl and add images array if collection exists
    try {
      const templesColl = db.collection('temples');
      for (const folderEnt of templeFolders) {
        const folderName = folderEnt.name;
        const images = templeImagesMap[folderName] || [];
        const primaryImage = images[0]?.url || `/temples/${folderName}/1.jpg`;

        await templesColl.updateOne(
          { name: { $regex: folderName.replace(/_/g, ' '), $options: 'i' } },
          {
            $set: {
              imageUrl: primaryImage,
              images: images.map(img => img.url)
            }
          }
        );
      }
    } catch (err) {
      // non-fatal
    }

    console.info(`💾 Persisted ${inserted} images (skipped ${skipped}) to ${dbName}.temple_images`);
    return { inserted, skipped, temples: templeImagesMap };
  } finally {
    await client.close();
  }
}

/**
 * Get all images for a specific temple from the database
 */
export async function getTempleImages(templeKey) {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    // Fallback: read from filesystem
    return getTempleImagesFromFS(templeKey);
  }

  const dbName = process.env.MONGODB_DB || process.env.DB_NAME || 'templetrip';
  const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });

  try {
    await client.connect();
    const db = client.db(dbName);
    const coll = db.collection('temple_images');

    const images = await coll.find({ temple_key: templeKey }).sort({ file_name: 1 }).toArray();

    if (images.length === 0) {
      // Fallback to filesystem if not in DB
      return getTempleImagesFromFS(templeKey);
    }

    return images.map(img => ({
      url: img.file_path,
      fileName: img.file_name,
      size: img.file_size,
      addedAt: img.added_at
    }));
  } catch (err) {
    console.warn(`⚠️ DB error fetching images for ${templeKey}: ${err.message}`);
    return getTempleImagesFromFS(templeKey);
  } finally {
    await client.close();
  }
}

/**
 * Fallback: Get images directly from filesystem
 */
function getTempleImagesFromFS(templeKey) {
  const folderPath = path.join(IMAGES_DIR, templeKey);

  if (!fs.existsSync(folderPath)) {
    return [];
  }

  const files = fs.readdirSync(folderPath)
    .filter(f => f.match(/\.(jpe?g|png|webp)$/i))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || '999');
      const numB = parseInt(b.match(/\d+/)?.[0] || '999');
      return numA - numB;
    });

  return files.map(fname => {
    const fsPath = path.join(folderPath, fname);
    const stat = fs.statSync(fsPath);
    return {
      url: `/temples/${templeKey}/${fname}`,
      fileName: fname,
      size: stat.size
    };
  });
}

/**
 * Get all images grouped by temple
 */
export async function getAllTempleImages() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    // Fallback: read from filesystem
    return getAllImagesFromFS();
  }

  const dbName = process.env.MONGODB_DB || process.env.DB_NAME || 'templetrip';
  const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });

  try {
    await client.connect();
    const db = client.db(dbName);
    const coll = db.collection('temple_images');

    const images = await coll.find({}).sort({ temple_key: 1, file_name: 1 }).toArray();

    if (images.length === 0) {
      return getAllImagesFromFS();
    }

    // Group by temple
    const grouped = {};
    for (const img of images) {
      if (!grouped[img.temple_key]) {
        grouped[img.temple_key] = [];
      }
      grouped[img.temple_key].push({
        url: img.file_path,
        fileName: img.file_name,
        size: img.file_size
      });
    }

    return grouped;
  } catch (err) {
    console.warn(`⚠️ DB error fetching all images: ${err.message}`);
    return getAllImagesFromFS();
  } finally {
    await client.close();
  }
}

function getAllImagesFromFS() {
  if (!fs.existsSync(IMAGES_DIR)) {
    return {};
  }

  const grouped = {};
  const templeFolders = fs.readdirSync(IMAGES_DIR, { withFileTypes: true }).filter(d => d.isDirectory());

  for (const folderEnt of templeFolders) {
    grouped[folderEnt.name] = getTempleImagesFromFS(folderEnt.name);
  }

  return grouped;
}

export default persistTempleImages;
