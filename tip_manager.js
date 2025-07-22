import cs_qs from './data/cs_questions.json' with { type: 'json' };

export function get_cs_q() {
    const index = Math.floor(Math.random() * cs_qs.length);
    return cs_qs[index];
}

export async function get_quote() {
    const quote = (await fetch("https://zenquotes.io/api/random").then(res => res.json()))[0];
    console.log(quote);
    return `${quote.q} - ${quote.a}`
}
