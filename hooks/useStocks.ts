import { useCallback, useEffect, useState } from "react";
import { Stock, Wallet, Dividend } from "@/lib/types";
import axios from "axios";
import { getMe } from "@/lib/getMe";
import { calculateStock } from "@/lib/stocksCalculations";
import { getCurrentHourPrice, getCurrentPrice } from "@/lib/getCurrentPrice";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UseStocksProps {
  search: string;
  typeSearch: string;
  consolidateStocks: boolean;
  chartType: string;
}

export function useStocks({ search, typeSearch, consolidateStocks, chartType }: UseStocksProps) {
  const router = useRouter();
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [processedStocks, setProcessedStocks] = useState<Stock[]>([]);
  const [processedChartData, setProcessedChartData] = useState<Array<{ name: string, value: number, type: string, walletId?: string }>>([]);
  const [hourPrice, setHourPrice] = useState<string>("");

  // Portfolio metrics state
  const [portfolioMetrics, setPortfolioMetrics] = useState({
    portfolioValue: 0,
    currentValue: 0,
    totalProfit: 0,
    totalProfitPercentage: 0
  });

  // Fetch stocks and wallets on component mount
  useEffect(() => {
    fetchStocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to fetch stocks and wallets data
  const fetchStocks = async () => {
    setIsFetching(true);

    const me = await getMe();

    if (!me) {
      toast.error("Sessão expirada, faça login novamente!");
      router.push("/auth/login");
      setIsFetching(false);
      return;
    }

    try {
      // Fetch stocks and wallets in parallel for better performance
      const [stocksResponse, walletsResponse] = await Promise.all([
        axios.get(`/api/stocks/${me.userId}`),
        axios.get(`/api/wallets/${me.userId}`)
      ]);

      setStocks(stocksResponse.data);
      setWallets(walletsResponse.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    }
  };

  // Consolidate stocks by ticker and wallet
  const getConsolidatedStocks = useCallback(async () => {
    // Map to track all stocks by ticker-wallet combo
    const allStocksMap = new Map<string, Stock[]>();
    const tickerPriceCache = new Map<string, number>();

    // First get unique tickers to batch price fetching
    const uniqueTickers = Array.from(new Set(stocks.map(stock => stock.ticker)));
    
    // Batch fetch prices for all tickers
    await Promise.all(uniqueTickers.map(async (ticker) => {
      try {
        const price = await getCurrentPrice(ticker);
        tickerPriceCache.set(ticker, price);
      } catch (error) {
        console.error(`Error fetching price for ${ticker}:`, error);
        tickerPriceCache.set(ticker, 0); // Default to 0 on error
      }
    }));

    // Group all stocks by ticker-wallet
    for (const stock of stocks) {
      const key = `${stock.ticker}-${stock.walletId}`;
      
      if (allStocksMap.has(key)) {
        allStocksMap.set(key, [...allStocksMap.get(key)!, stock]);
      } else {
        allStocksMap.set(key, [stock]);
      }
    }

    // Process each group
    const result: Stock[] = [];

    for (const [key, stockGroup] of allStocksMap.entries()) {
      const currentPrice = tickerPriceCache.get(stockGroup[0].ticker) || 0;
      const totalStocksInGroup = stockGroup.length;
      const soldStocksInGroup = stockGroup.filter(s => s.sellDate !== null).length;
      const allSold = soldStocksInGroup === totalStocksInGroup;

      if (allSold) {
        // All stocks in this group are sold, consolidate them
        let totalQuantity = 0;
        let totalBuyValue = 0;
        let totalSellValue = 0;
        let allDividends: Dividend[] = [];

        for (const s of stockGroup) {
          totalQuantity += s.quantity;
          totalBuyValue += s.buyPrice * s.quantity;
          totalSellValue += (s.sellPrice || 0) * s.quantity;
          allDividends = [...allDividends, ...(s.dividends || [])];
        }

        // Use the most recent sell date
        const lastSoldStock = stockGroup.sort((a: Stock, b: Stock) =>
          new Date(b.sellDate || 0).getTime() - new Date(a.sellDate || 0).getTime()
        )[0];

        const avgBuyPrice = totalBuyValue / totalQuantity;
        const avgSellPrice = totalSellValue / totalQuantity;

        result.push({
          ...stockGroup[0],
          id: `consolidated-sold-${key}`,
          quantity: totalQuantity,
          buyPrice: avgBuyPrice,
          sellPrice: avgSellPrice,
          sellDate: lastSoldStock.sellDate,
          price: currentPrice,
          dividends: allDividends,
          isSold: true
        });
      } else {
        // Group has some active stocks - only consolidate the active ones
        const activeStocks = stockGroup.filter(s => s.sellDate === null);

        if (activeStocks.length > 0) {
          let totalQuantity = 0;
          let totalBuyValue = 0;
          let allDividends: Dividend[] = [];

          for (const s of activeStocks) {
            totalQuantity += s.quantity;
            totalBuyValue += s.buyPrice * s.quantity;
            allDividends = [...allDividends, ...(s.dividends || [])];
          }

          const avgBuyPrice = totalBuyValue / totalQuantity;

          result.push({
            ...activeStocks[0],
            id: `consolidated-active-${key}`,
            quantity: totalQuantity,
            buyPrice: avgBuyPrice,
            price: currentPrice,
            dividends: allDividends,
            isSold: false
          });
        }
      }
    }

    return result;
  }, [stocks]);

  // Get stocks based on consolidation preference
  const getStocksToUse = useCallback(async (): Promise<Stock[]> => {
    if (consolidateStocks) {
      return await getConsolidatedStocks();
    }

    // Batch fetch prices for unique tickers to update non-consolidated stocks
    const uniqueTickers = Array.from(new Set(stocks.map(stock => stock.ticker)));
    const tickerPriceCache = new Map<string, number>();
    
    await Promise.all(uniqueTickers.map(async (ticker) => {
      try {
        const price = await getCurrentPrice(ticker);
        tickerPriceCache.set(ticker, price);
      } catch (error) {
        console.error(`Error fetching price for ${ticker}:`, error);
        tickerPriceCache.set(ticker, 0);
      }
    }));

    return stocks.map(stock => ({
      ...stock,
      price: tickerPriceCache.get(stock.ticker) || 0,
      dividends: stock.dividends || []
    }));
  }, [consolidateStocks, getConsolidatedStocks, stocks]);

  // Generate chart data based on chart type and filtered stocks
  const generateChartData = useCallback(async (filteredStocks: Stock[]): Promise<{ name: string, value: number, type: string, walletId?: string }[]> => {
    if (chartType === "by-asset") {
      return filteredStocks.map(stock => ({
        name: stock.ticker,
        value: calculateStock(stock).currentValue,
        type: stock.type,
        walletId: stock.walletId
      }));
    } else if (chartType === "by-wallet") {
      // Group by wallet
      const walletGroups: Record<string, { value: number, name: string, type: string }> = {};

      filteredStocks.forEach(stock => {
        const value = calculateStock(stock).currentValue;
        const walletId = stock.walletId;

        // Find wallet name in wallets array
        const wallet = wallets.find(w => w.id === walletId);
        const walletName = wallet?.name || "Carteira Desconhecida";

        if (walletGroups[walletId]) {
          walletGroups[walletId].value += value;
        } else {
          walletGroups[walletId] = {
            value,
            name: walletName,
            type: `wallet-${walletId}` // usando como identificador único
          };
        }
      });

      return Object.values(walletGroups).map(({ name, value, type }) => ({
        name,
        value,
        type
      }));
    } else {
      // Group by type
      const typeGroups: Record<string, number> = {};
      filteredStocks.forEach(stock => {
        const value = calculateStock(stock).currentValue;
        if (typeGroups[stock.type]) {
          typeGroups[stock.type] += value;
        } else {
          typeGroups[stock.type] = value;
        }
      });

      return Object.entries(typeGroups).map(([type, value]) => {
        const displayName = type === "stock" ? "Ações" :
          type === "real-estate" ? "FIIs" :
            type === "etf" ? "ETFs" : type;
        return {
          name: displayName,
          value,
          type
        };
      });
    }
  }, [chartType, wallets]);

  // Process stock data (filter, calculate metrics, generate chart data)
  const processStockData = useCallback(async () => {
    setIsFetching(true);
    
    try {
      const stocksToUse = await getStocksToUse();

      // Filter by search and type
      const filteredStocks = stocksToUse.filter(
        (stock) => stock.ticker.toLowerCase().includes(search.toLowerCase()) ||
          stock.name.toLowerCase().includes(search.toLowerCase()))
        .filter((stock) => typeSearch === "all" || stock.type === typeSearch);

      // Filter out sold stocks for calculations
      const activeStocks = filteredStocks.filter(stock => stock.sellDate === null);

      setProcessedStocks(filteredStocks);

      // Calculate portfolio metrics only for ACTIVE stocks
      const portfolioValue = activeStocks.reduce((total, stock) => total + calculateStock(stock).totalInvested, 0);
      const currentValue = activeStocks.reduce((total, stock) => total + calculateStock(stock).currentValue, 0);
      const totalProfit = activeStocks.reduce((total, stock) => total + calculateStock(stock).totalProfit, 0);
      const totalProfitPercentage = portfolioValue > 0 ? (totalProfit / portfolioValue) : 0;

      // Update portfolio metrics
      setPortfolioMetrics({
        portfolioValue,
        currentValue,
        totalProfit,
        totalProfitPercentage
      });

      // Generate chart data (only with active stocks)
      const chartData = await generateChartData(activeStocks);
      setProcessedChartData(chartData);

      // Get hour price for UI display
      const hourPrice = await getCurrentHourPrice();
      setHourPrice(hourPrice);
    } catch (error) {
      console.error("Error processing data:", error);
      // Set default values in case of error
      setProcessedStocks([]);
      setPortfolioMetrics({
        portfolioValue: 0,
        currentValue: 0,
        totalProfit: 0,
        totalProfitPercentage: 0
      });
      setProcessedChartData([]);
    } finally {
      setIsFetching(false);
    }
  }, [generateChartData, getStocksToUse, search, typeSearch]);

  return {
    stocks,
    wallets,
    processedStocks,
    processedChartData,
    portfolioMetrics,
    isFetching,
    hourPrice,
    fetchStocks,
    processStockData
  };
} 