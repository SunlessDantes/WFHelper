// Korean-client glue for the trade log. The game writes the trade confirmation
// dialog to EE.log in the client language, so the English parser sees
// nothing. On the Korean client only, these turn the dialog into the English shape
// it reads, item names included: English stays the join key for warframe.market.

import { getRendererLookup } from "../itemDatabase";
import { isKoreanClient } from "./koLocale";
import { KO_TRADE_SUCCESS } from "../../config/shared/korean/koLogLines";
import {
  buildTradeNameIndex,
  englishTradeItemName,
  localizedTradeItemName as localizedName,
  type TradeNameIndex,
} from "../../config/shared/korean/tradeNames";

const KO_DIALOG_START = "이 거래를 수락하시겠습니까?";
const KO_OFFERING = "현재 제시중인 아이템:";
const KO_RECEIVING = /([^\s]+)\s*플레이어에게 다음 거래 아이템을 받습니다:/;
const KO_PLATINUM = "플래티넘";

const HANGUL = /[가-힣]/;
const STACK_SUFFIX = /^(.+?)\s+x\s+(\d+)$/i;

/** Where the dialog starts on this line, in either client language; -1 if absent. */
export function findTradeDialogStart(line: string, english: string): number {
  const at = line.indexOf(english);
  return at >= 0 || !isKoreanClient() ? at : line.indexOf(KO_DIALOG_START);
}

export function isTradeSuccessLine(line: string, english: string): boolean {
  return line.includes(english) || (isKoreanClient() && line.includes(KO_TRADE_SUCCESS));
}

/** The dialog's two block headers in English; the item lines go through
 *  {@link englishTradeItemLine} one by one. */
export function englishTradeDialog(text: string): string {
  if (!isKoreanClient() || !text.includes(KO_OFFERING)) return text;
  return text
    .replace(KO_OFFERING, "You are offering:")
    .replace(
      KO_RECEIVING,
      (_whole, partner: string) => `and will receive from ${partner} the following:`,
    );
}

/** One item line in its English form, platinum and stack counts included. A name
 *  the dictionary cannot place stays Korean, so the trade still records. */
export function englishTradeItemLine(line: string): string {
  if (!isKoreanClient() || !HANGUL.test(line)) return line;
  const trimmed = line.trim();
  const stack = STACK_SUFFIX.exec(trimmed);
  const name = stack ? stack[1].trim() : trimmed;
  const tail = stack ? ` x ${stack[2]}` : "";
  if (name === KO_PLATINUM) return `Platinum${tail}`;
  return `${englishTradeItemName(name, nameIndex()) ?? name}${tail}`;
}

// Cached per projection: getRendererLookup rebuilds it on a language or database
// change, so the index follows the game language.
let cached: { lookup: object; index: TradeNameIndex } | null = null;

function nameIndex(): TradeNameIndex {
  const lookup = getRendererLookup();
  if (cached?.lookup !== lookup) cached = { lookup, index: buildTradeNameIndex(lookup) };
  return cached.index;
}

export function localizedTradeItemName(english: string): string {
  return localizedName(english, nameIndex());
}
