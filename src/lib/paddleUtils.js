import { Paddle } from '@paddle/paddle-node-sdk';

export const getPricePreview = async (priceId, countryCode) => {
  try {
    const request = {
      items: [
        {
          quantity: 1,
          priceId: priceId
        }
      ],
      address: {
        countryCode: countryCode
      }
    };

    console.log("Fetching prices:", request);
    const result = await Paddle.PricePreview(request);
    console.log("Prices updated:", result);

    return result.data.details.lineItems[0].formattedTotals.subtotal;
  } catch (error) {
    console.error(`Error fetching prices: ${error.message}`);
    return null;
  }
};