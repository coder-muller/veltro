const API_KEY = process.env.NEXT_PUBLIC_BRAPI_API_KEY;
import { toast } from "sonner";

export const getCurrentPrice = async (ticker: string) => {
    try {
        const response = await fetch(`https://brapi.dev/api/quote/${ticker}?token=${API_KEY}`);
        const data = await response.json();

        if (!data || !data.results || data.results.length === 0) {
            toast.error(`Erro ao buscar preço do ativo ${ticker}`, {
                description: "Verifique se o ticker está correto e tente novamente.",
            });
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
        const response = await fetch(`https://brapi.dev/api/quote/BBAS3?token=${API_KEY}`);
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
