export const getCurrentPrice = async (ticker: string) => {
    try {
        const response = await fetch(`https://brapi.dev/api/quote/${ticker}?token=vpZaARCJupnabbnfh2icp4`);
        const data = await response.json();

        if (!data || !data.results || data.results.length === 0) {
            return 0;
        }

        return data.results[0].regularMarketPrice || 0;
    } catch (error) {
        console.error(`Error fetching price for ${ticker}:`, error);
        return 0;
    }
};

export const getCurrentHourPrice = async (): Promise<string> => {
    try {
        const response = await fetch(`https://brapi.dev/api/quote/BBAS3?token=vpZaARCJupnabbnfh2icp4`);
        const data = await response.json();

        if (!data || !data.results || data.results.length === 0) {
            return "";
        }

        return data.results[0].regularMarketTime || "";
    } catch (error) {
        console.error(`Error fetching current hour price:`, error);
        return "";
    }
};
