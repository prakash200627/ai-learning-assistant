import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'localDB.json');

const ensureDBFile = () => {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
      users: [],
      documents: [],
      flashcards: [],
      quizzes: []
    }, null, 2));
  }
};

const readLocalDB = () => {
  ensureDBFile();
  try {
    const content = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    return { users: [], documents: [], flashcards: [], quizzes: [] };
  }
};

const writeLocalDB = (data) => {
  ensureDBFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

const readLocalCollection = (collection) => {
  const db = readLocalDB();
  return db[collection] || [];
};

const writeLocalCollection = (collection, items) => {
  const db = readLocalDB();
  db[collection] = items;
  writeLocalDB(db);
};

export const generateId = () => {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

const matchQuery = (item, query) => {
  if (!query || Object.keys(query).length === 0) return true;

  for (const key of Object.keys(query)) {
    const val = query[key];

    if (key === '$or') {
      if (!Array.isArray(val) || !val.some(subQuery => matchQuery(item, subQuery))) {
        return false;
      }
      continue;
    }

    if (key.includes('.')) {
      const parts = key.split('.');
      const checkNested = (obj, pathIdx) => {
        if (obj === undefined || obj === null) return false;
        const part = parts[pathIdx];
        
        if (pathIdx === parts.length - 1) {
          if (Array.isArray(obj)) {
            return obj.some(subItem => subItem === val || (subItem && subItem.toString() === val.toString()));
          }
          return obj === val || (obj && obj.toString() === val.toString());
        }
        
        if (Array.isArray(obj)) {
          return obj.some(subObj => checkNested(subObj[part], pathIdx + 1));
        }
        return checkNested(obj[part], pathIdx + 1);
      };
      
      if (!checkNested(item[parts[0]], 1)) {
        return false;
      }
      continue;
    }

    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const ops = Object.keys(val);
      if (ops.some(k => k.startsWith('$'))) {
        const op = ops[0];
        const opVal = val[op];
        const itemVal = item[key];
        
        if (op === '$ne') {
          if (itemVal === opVal || (itemVal && opVal && itemVal.toString() === opVal.toString())) {
            return false;
          }
        }
        continue;
      }
    }

    const itemVal = item[key];
    if (itemVal === undefined) return false;
    
    if (val === null) {
      if (itemVal !== null) return false;
    } else if (itemVal === null) {
      if (val !== null) return false;
    } else if (itemVal.toString() !== val.toString()) {
      return false;
    }
  }

  return true;
};

export const wrapInstance = (collectionName, data) => {
  if (!data) return data;
  
  const instance = JSON.parse(JSON.stringify(data));
  
  // Custom mock ID conversions so .toString() and JSON.stringify() serialize correctly
  if (instance._id) {
    const rawId = instance._id;
    instance._id = {
      toString: () => rawId,
      valueOf: () => rawId,
      toJSON: () => rawId
    };
  }

  if (instance.cards && Array.isArray(instance.cards)) {
    instance.cards.forEach(card => {
      if (card._id) {
        const cid = card._id;
        card._id = {
          toString: () => cid,
          valueOf: () => cid,
          toJSON: () => cid
        };
      }
    });

    instance.cards.pull = function(cardId) {
      const cleanId = cardId.toString();
      const index = this.findIndex(c => c._id.toString() === cleanId);
      if (index !== -1) {
        this.splice(index, 1);
      }
    };

    instance.cards.id = function(cardId) {
      const cleanId = cardId.toString();
      return this.find(c => c._id.toString() === cleanId);
    };
  }

  instance.save = async function() {
    const rawItem = JSON.parse(JSON.stringify(this));
    
    if (rawItem._id && typeof rawItem._id === 'object') {
      rawItem._id = this._id.toString();
    }
    if (rawItem.cards && Array.isArray(rawItem.cards)) {
      rawItem.cards.forEach(card => {
        if (card._id && typeof card._id === 'object') {
          card._id = card._id.toString();
        }
      });
    }

    const items = readLocalCollection(collectionName);
    const idx = items.findIndex(item => item._id.toString() === rawItem._id.toString());
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...rawItem, updatedAt: new Date().toISOString() };
    } else {
      items.push({ ...rawItem, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    writeLocalCollection(collectionName, items);
    return this;
  };

  instance.deleteOne = async function() {
    const items = readLocalCollection(collectionName);
    const rawId = this._id.toString();
    const filtered = items.filter(item => item._id.toString() !== rawId);
    writeLocalCollection(collectionName, filtered);
    return { deletedCount: 1 };
  };

  if (collectionName === 'users') {
    instance.matchPassword = async function(enteredPassword) {
      try {
        return await bcrypt.compare(enteredPassword, this.password);
      } catch (err) {
        return enteredPassword === this.password;
      }
    };
  }

  return instance;
};

class MockQuery {
  constructor(data) {
    this.data = data;
  }
  select() { return this; }
  sort(compareFnOrObj) {
    if (Array.isArray(this.data)) {
      if (typeof compareFnOrObj === 'object') {
        const key = Object.keys(compareFnOrObj)[0];
        const dir = compareFnOrObj[key];
        this.data.sort((a, b) => {
          const valA = a[key] ? new Date(a[key]) : 0;
          const valB = b[key] ? new Date(b[key]) : 0;
          return dir === -1 ? valB - valA : valA - valB;
        });
      }
    }
    return this;
  }
  limit(num) {
    if (Array.isArray(this.data)) {
      this.data = this.data.slice(0, num);
    }
    return this;
  }
  populate(path) {
    const handlePopulate = (item) => {
      if (item && item[path]) {
        const refId = item[path].toString();
        const docs = readLocalCollection('documents');
        const doc = docs.find(d => d._id.toString() === refId);
        if (doc) {
          item[path] = doc;
        } else {
          item[path] = { _id: refId, title: "Mock Document" };
        }
      }
    };

    if (Array.isArray(this.data)) {
      this.data.forEach(handlePopulate);
    } else if (this.data) {
      handlePopulate(this.data);
    }
    return this;
  }
  then(onfulfilled, onrejected) {
    return Promise.resolve(this.data).then(onfulfilled, onrejected);
  }
}

export const getMockModel = (collectionName) => {
  return {
    find: (query) => {
      const items = readLocalCollection(collectionName);
      const filtered = items.filter(item => matchQuery(item, query));
      const wrapped = filtered.map(item => wrapInstance(collectionName, item));
      return new MockQuery(wrapped);
    },
    findOne: (query) => {
      const items = readLocalCollection(collectionName);
      const matched = items.find(item => matchQuery(item, query));
      return new MockQuery(wrapInstance(collectionName, matched || null));
    },
    findById: (id) => {
      if (!id) return new MockQuery(null);
      const items = readLocalCollection(collectionName);
      const matched = items.find(item => item._id.toString() === id.toString());
      return new MockQuery(wrapInstance(collectionName, matched || null));
    },
    countDocuments: async (query) => {
      const items = readLocalCollection(collectionName);
      const filtered = items.filter(item => matchQuery(item, query));
      return filtered.length;
    },
    create: async (data) => {
      const items = readLocalCollection(collectionName);
      
      const payload = JSON.parse(JSON.stringify(data));
      if (collectionName === 'users' && payload.password && !payload.password.startsWith('$2a$')) {
        const salt = await bcrypt.genSalt(10);
        payload.password = await bcrypt.hash(payload.password, salt);
      }

      if (collectionName === 'flashcards' && payload.cards && Array.isArray(payload.cards)) {
        payload.cards.forEach(card => {
          if (!card._id) card._id = generateId();
        });
      }

      const newItem = {
        _id: generateId(),
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      items.push(newItem);
      writeLocalCollection(collectionName, items);
      return wrapInstance(collectionName, newItem);
    },
    deleteOne: async (query) => {
      const items = readLocalCollection(collectionName);
      const index = items.findIndex(item => matchQuery(item, query));
      if (index !== -1) {
        items.splice(index, 1);
        writeLocalCollection(collectionName, items);
        return { deletedCount: 1 };
      }
      return { deletedCount: 0 };
    },
    deleteMany: async (query) => {
      const items = readLocalCollection(collectionName);
      const initialLength = items.length;
      const filtered = items.filter(item => !matchQuery(item, query));
      writeLocalCollection(collectionName, filtered);
      return { deletedCount: initialLength - filtered.length };
    }
  };
};
