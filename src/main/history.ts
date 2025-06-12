import { Transcript } from '../common/types';
import { v4 as uuidv4 } from 'uuid';

export class TranscriptHistory {
  private history: Transcript[] = [];
  private readonly maxSize = 20; // Circular buffer size

  constructor() {
    console.log('Transcript history initialized');
  }

  /**
   * Add a new transcript to the history
   */
  public push(text: string, durationSec: number): Transcript {
    const transcript: Transcript = {
      id: uuidv4(),
      text: text.trim(),
      ts: Date.now(),
      durationSec
    };

    // Add to beginning of array (most recent first)
    this.history.unshift(transcript);

    // Maintain circular buffer size
    if (this.history.length > this.maxSize) {
      this.history = this.history.slice(0, this.maxSize);
    }

    console.log(`Added transcript to history: "${this.truncateText(text, 50)}" (${this.history.length}/${this.maxSize})`);
    
    return transcript;
  }

  /**
   * Get all transcripts, most recent first
   */
  public list(): Transcript[] {
    return [...this.history]; // Return copy to prevent mutation
  }

  /**
   * Get a specific transcript by ID
   */
  public getById(id: string): Transcript | undefined {
    return this.history.find(t => t.id === id);
  }

  /**
   * Get recent transcripts with limit
   */
  public getRecent(limit: number = 10): Transcript[] {
    return this.history.slice(0, Math.min(limit, this.history.length));
  }

  /**
   * Get the count of stored transcripts
   */
  public count(): number {
    return this.history.length;
  }

  /**
   * Clear all transcripts (on app restart)
   */
  public clear(): void {
    this.history = [];
    console.log('Transcript history cleared');
  }

  /**
   * Get transcripts within a time range
   */
  public getInTimeRange(startTs: number, endTs: number): Transcript[] {
    return this.history.filter(t => t.ts >= startTs && t.ts <= endTs);
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }
} 