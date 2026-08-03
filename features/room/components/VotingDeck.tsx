"use client";
import { useTranslations } from "next-intl";
import { DECK, type VoteValue } from "@/lib/constants";
export function VotingDeck({ selected, roundOpen, observer, onVote, onBecomeVoter }: { selected?: string; roundOpen: boolean; observer: boolean; onVote: (value: VoteValue) => void; onBecomeVoter: () => void }) {
  const t = useTranslations("Voting");
  const disabled = !roundOpen || observer;
  const message = observer && roundOpen
    ? t("observerMessage")
    : !roundOpen ? t("waitingRound") : selected ? t("voted", { value: selected }) : t("privateVote");
  return <section className={`voting-dock ${observer && roundOpen ? "observer-deck" : ""}`} aria-label={t("deckLabel")}>
    <div className="deck-caption"><strong>{observer && roundOpen ? t("observerMode") : t("chooseCard")}</strong><span>{message}</span>{observer && roundOpen && <button type="button" className="soft-button" onClick={onBecomeVoter}>{t("becomeVoter")}</button>}</div>
    <div className="deck-cards">{DECK.map(value => <button key={value} disabled={disabled} className={selected === value ? "selected" : ""} aria-pressed={selected === value} onClick={() => onVote(value)}>{value}</button>)}</div>
  </section>;
}
