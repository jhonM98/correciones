// import type { Core } from '@strapi/strapi';
const API_DAILY = "api::dailymenu.dailymenu";
const API_DISH = "api::dish.dish";

export async function auxiliar_function(event) {
  const { params, result } = event;

  console.log("PARAMS ");
  console.log(event);

  const daily = await strapi.documents(API_DAILY).findOne({
    documentId: result.documentId,
    populate: {
      first: true,
      second: true,
      dessert: true,
    },
  });

  const { SumPrecio, documentId, PriceWithTaxes, Price } = daily;

  const total = await strapi.service(API_DAILY).priceDailyMenu(daily);
  console.log("PRECIO TOTAL");
  console.log(total);

  if (SumPrecio !== total) {
    const change = await strapi.documents(API_DAILY).update({
      documentId: documentId,
      data: {
        SumPrecio: total,
      },
    });
  }

  const newPrice = await strapi.service(API_DAILY).includeTaxes(daily);

  if (newPrice != PriceWithTaxes) {
    const changePrice = await strapi.documents(API_DAILY).update({
      documentId: documentId,
      data: {
        PriceWithTaxes: newPrice,
      },
    });
  }
}
