import mongoose from 'mongoose';

export const THEME_MODES = ['system', 'light', 'dark'];

const appSettingsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    /** 'system' keeps the app on the phone's appearance, which is the default. */
    theme: { type: String, enum: THEME_MODES, default: 'system' },

    voiceEnabled: { type: Boolean, default: true },
    voiceSpeed: { type: Number, min: 0.7, max: 1.2, default: 1 },
    preferredVoice: { type: String, trim: true, maxlength: 60, default: '' },
    autoSpeakReplies: { type: Boolean, default: false },

    hapticsEnabled: { type: Boolean, default: true },
    reduceMotion: { type: Boolean, default: false },
    showNutritionOnCards: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const AppSettings = mongoose.model('AppSettings', appSettingsSchema);

export function publicSettings(settings) {
  return {
    theme: settings.theme,
    voiceEnabled: settings.voiceEnabled,
    voiceSpeed: settings.voiceSpeed,
    preferredVoice: settings.preferredVoice || '',
    autoSpeakReplies: settings.autoSpeakReplies,
    hapticsEnabled: settings.hapticsEnabled,
    reduceMotion: settings.reduceMotion,
    showNutritionOnCards: settings.showNutritionOnCards,
    updatedAt: settings.updatedAt,
  };
}
