import * as LRUCache from "lru-cache";

import ICacheService from "./ICacheService";

export default class CacheService implements ICacheService {
    private static CACHE_VERSION = "v1.0.5";
    private static CACHE_QUOTA_RATIO = .8;
    private static LRU_CACHE_DATA_KEY = "lrucache";
    private static DB_NAME = "kaiplayer";
    private static STORE_NAME = "cache";
    private static DB_VERSION = 1;
    private static dbNotInitError = new Error("DB not initialized.");
    private cache?: Cache;
    private lruCache?: LRUCache<string, number>;
    private db?: IDBDatabase;

    public async init() {
        if (this.cache && this.lruCache && this.db) {
            return;
        }

        const cachePromise = caches.open(CacheService.CACHE_VERSION);

        const quotaPromise = (async () => {
            if (!("estimate" in navigator.storage)) {
                return Infinity;
            }

            return (await navigator.storage.estimate()).quota || Infinity;
        })();

        const dbPromise = this.initDb();

        this.lruCache = new LRUCache<string, number>({
            length: (n) => n,
            max: await quotaPromise ? await quotaPromise * CacheService.CACHE_QUOTA_RATIO : Infinity,

            dispose: async (url) => {
                for (const request of await (await cachePromise).keys()) {
                    if (request.url === url) {
                        (await cachePromise).delete(request);
                    }
                }
            },

            noDisposeOnSet: true,
        });

        await dbPromise;

        const lruCacheData = await this.readLruCache();

        if (lruCacheData) {
            try {
                this.lruCache.load(lruCacheData);
            } catch (e) {
                // console.log(e);
            }
        }

        this.cache = await cachePromise;
    }

    public async checkVersion() {
        await Promise.all((await caches.keys()).map(async (cacheName) => {
            if (CacheService.CACHE_VERSION !== cacheName) {
                await caches.delete(cacheName);
            }
        }));
    }

    public match(request: Request) {
        if (!this.lruCache || !this.cache) {
            return;
        }

        try {
            return typeof this.lruCache.get(request.url) !== "undefined" ? this.cache.match(request) : undefined;
        } catch (e) {
            // console.log(e);
        }
    }

    public async put(request: Request, response: Response) {
        if (!this.lruCache || !this.cache) {
            return;
        }

        const byteLength = await (async () => {
            try {
                return (await response.clone().arrayBuffer()).byteLength;
            } catch (e) {
                // console.log(e);

                try {
                    const contentLength = response.clone().headers.get("content-length");
                    return (contentLength && +contentLength) || undefined;
                } catch (e) {
                    // console.log(e);

                    return undefined;
                }
            }
        })();

        if (!byteLength) {
            return;
        }

        await this.cache.put(request, response.clone());

        this.lruCache.set(request.url, byteLength);
        this.saveLruCache(this.lruCache.dump());
    }

    private initDb(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(CacheService.DB_NAME, CacheService.DB_VERSION);

            request.onerror = () => {
                reject(new Error("Error creating database"));
            };

            request.onsuccess = () => {
                this.db = request.result;

                resolve();
            };

            request.onupgradeneeded = (event) => {
                // @ts-ignore
                const db = event.target.result;

                this.db = db;

                if (!db.objectStoreNames.contains(CacheService.STORE_NAME)) {
                    return db.createObjectStore(CacheService.STORE_NAME, { keyPath: "id" });
                }

                resolve();
            };
        });
    }

    private saveLruCache(data: Array<LRUCache.Entry<string, number>>): Promise<void> {
        const writeDataError = new Error("Error writing data");

        return new Promise((resolve, reject) => {
            if (!this.db) {
                throw CacheService.dbNotInitError;
            }

            const transaction = this.db.transaction([CacheService.STORE_NAME], "readwrite");

            transaction.oncomplete = () => {
                resolve();
            };

            transaction.onerror = () => {
                reject(writeDataError);
            };

            const objectStore = transaction.objectStore(CacheService.STORE_NAME);

            const request = objectStore.put({
                id: CacheService.LRU_CACHE_DATA_KEY,

                data: JSON.stringify(data),
            });

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(writeDataError);
            };
        });
    }

    private readLruCache(): Promise<Array<LRUCache.Entry<string, number>>> {
        const readDataError = new Error("Error reading data");

        return new Promise((resolve, reject) => {
            if (!this.db) {
                throw CacheService.dbNotInitError;
            }

            const transaction = this.db.transaction([CacheService.STORE_NAME], "readwrite");

            transaction.oncomplete = () => {
                if (request.result) {
                    resolve(request.result && request.result.data && JSON.parse(request.result.data));
                }
            };

            transaction.onerror = () => {
                reject(readDataError);
            };

            const objectStore = transaction.objectStore(CacheService.STORE_NAME);
            const request = objectStore.get(CacheService.LRU_CACHE_DATA_KEY);

            request.onsuccess = () => {
                resolve(request.result && request.result.data && JSON.parse(request.result.data));
            };

            request.onerror = () => {
                reject(readDataError);
            };
        });
    }
}
