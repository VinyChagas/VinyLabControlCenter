export interface ElevenLabsUsageProvider {
  getUsage(): Promise<{ characters: number; cost: number }>;
}
