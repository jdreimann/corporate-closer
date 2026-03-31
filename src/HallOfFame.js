export class HallOfFame {
    constructor() {
        this.storageKey = 'corporateCloser_hallOfFame';
        this.maxEntries = 10;
    }

    getScores() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    saveScore(name, score, victory) {
        const scores = this.getScores();
        scores.push({
            name: name.substring(0, 20),
            score,
            victory,
            date: new Date().toISOString()
        });
        scores.sort((a, b) => b.score - a.score);
        const trimmed = scores.slice(0, this.maxEntries);
        localStorage.setItem(this.storageKey, JSON.stringify(trimmed));
        return trimmed;
    }

    isHighScore(score) {
        const scores = this.getScores();
        if (scores.length < this.maxEntries) return true;
        return score > scores[scores.length - 1].score;
    }

    getRank(score) {
        const scores = this.getScores();
        for (let i = 0; i < scores.length; i++) {
            if (score >= scores[i].score) return i + 1;
        }
        return scores.length + 1;
    }

    clearScores() {
        localStorage.removeItem(this.storageKey);
    }
}
