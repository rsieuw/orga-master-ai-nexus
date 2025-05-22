/**
 * Cache utiliteit om databankoproepen te verminderen
 * Hiermee kunnen we gegevens cachen voor een bepaalde tijd om het aantal Supabase API calls te reduceren
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

/**
 * Klasse voor het beheren van een in-memory cache
 * @template T Het type data dat opgeslagen wordt
 */
export class MemoryCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private readonly ttl: number;

  /**
   * Initialiseert een nieuwe cache-instantie
   * @param ttl Time-to-live in milliseconden - standaard 30 seconden
   */
  constructor(ttl = 30000) {
    this.ttl = ttl;
  }

  /**
   * Haalt een item op uit de cache
   * @param key De cachekey
   * @returns Het opgeslagen item of undefined als het niet bestaat of verlopen is
   */
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    const now = Date.now();

    // Controleer of het item bestaat en niet verlopen is
    if (item && now - item.timestamp < this.ttl) {
      return item.data;
    }

    // Verwijder het verlopen item indien nodig
    if (item) {
      this.cache.delete(key);
    }

    return undefined;
  }

  /**
   * Slaat een item op in de cache
   * @param key De cachekey
   * @param data De data om op te slaan
   */
  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Verwijdert een item uit de cache
   * @param key De cachekey om te verwijderen
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Leegt de volledige cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Helpersfunctie om een api aanroep te cachen
   * @param key De cachekey
   * @param fetchFn De functie die de data ophaalt
   * @returns De data uit de cache of opnieuw opgehaald
   */
  async getOrFetch<R>(key: string, fetchFn: () => Promise<R>): Promise<R> {
    // Probeer eerst uit de cache
    const cachedData = this.get(key) as R | undefined;
    if (cachedData !== undefined) {
      return cachedData;
    }

    // Anders data ophalen en opslaan
    const data = await fetchFn();
    this.set(key, data as unknown as T);
    return data;
  }
}

// Singletons voor veelgebruikte caches
export const tasksCache = new MemoryCache(60000); // 1 minuut voor taken
export const settingsCache = new MemoryCache(300000); // 5 minuten voor instellingen
export const userCache = new MemoryCache(300000); // 5 minuten voor gebruikersgegevens 