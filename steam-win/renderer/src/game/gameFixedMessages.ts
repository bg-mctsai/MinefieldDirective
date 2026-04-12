import gameFixedMessagesJson from './gameFixedMessages.json';

export const GAME_FIXED = gameFixedMessagesJson;

/** 將 `{key}` 替換為 vars[key]（用於集中文案的插值） */
export function sub(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = vars[key];
    return v != null ? String(v) : `{${key}}`;
  });
}
