
const API_DAILY = "api::dailymenu.dailymenu";
const API_DISH = "api::dish.dish";

const { errors } = require("@strapi/utils");
const { ApplicationError } = errors;

module.exports = {
  async afterUpdate(event) {
    const { result } = event;
    
    // Sugerencias: evitar reclacular si ya fue actualizado
    if (event.state?.isCalculatedUpdate) return;


    // Sugerencias: optimizar la verificacion para evitar consultas innecesarias. mejorar la logica de control de "publisheAt",
    // mejorar la logica de control de "publisheAt", puede comprobarse antes de hacer la consulta.
     if (event.params.data && event.params.data.publishedAt) {
      return;
    }

    
    // Sugerencias: realizamos consultas optimizadas para evitar repeticiones de codigo, al obtener los datos del menu.
    // Sugerencia: Agregar un log cuando falten platos para facilitar el seguimiento del error
    const daily = await strapi.documents(API_DAILY).findOne({
      documentId: result.documentId,
      populate: {
        first: true,
        second: true,
        dessert: true,
      },
    });


    // Sugerencias: Verificamos que los platos estan completos antes de realizar los calculos de los precios.
    if (!daily.first || !daily.second || !daily.dessert) {
      throw new ApplicationError("Missing dish information in menu, skipping calculated update.");
    }

    const { SumPrecio, documentId, PriceWithTaxes } = daily;
    const sumPrice = await strapi.service(API_DAILY).priceDailyMenu(daily);

    const oldPrice = SumPrecio ?? 0;
    const newPrice = sumPrice ?? 0;

    
   // Realizar una comparacion precisa de los precios utilizando toFixed(2) para evitar problemas de redondeo.
    if (oldPrice.toFixed(2) !== newPrice.toFixed(2)) {
        await strapi.documents(API_DAILY).update({
          documentId,
          data: { SumPrecio: sumPrice },
          state: { isCalculatedUpdate: true },
        });
    }

    const priceTaxes = await strapi.service(API_DAILY).includeTaxes(daily);

   // Sugerencias: mejorar la conversion adecuada de impuestos a numeros, previniendo valores NaN.
    const oldPriceTaxes = typeof PriceWithTaxes === "number" ? PriceWithTaxes : parseFloat(PriceWithTaxes) || 0;
    const newPriceTaxes = typeof priceTaxes === "number" ? priceTaxes: parseFloat(priceTaxes) || 0;

    if (oldPriceTaxes.toFixed(2) !== newPriceTaxes.toFixed(2)) {
        await strapi.documents(API_DAILY).update({
          documentId,
          data: { PriceWithTaxes: priceTaxes },
          state: { isCalculatedUpdate: true },
        });
    }


  },
  async beforeCreate(event) {
    const { params } = event;
    const validateType = await strapi.service(API_DAILY).correctType(params);
    if (!validateType) {
      throw new ApplicationError("This plate is not in the correct type");
    }
  },
  async beforeUpdate(event) {
    const { params } = event;

    const validateType = await strapi.service(API_DAILY).correctType(params);

    if (!validateType) {
      throw new ApplicationError("This plate is not in the correct type");
    }
  },
  async afterCreate(event){
    const { params, result } = event;
    if (event.state?.isCalculatedUpdate) return;

    if (event.params.data && event.params.data.publishedAt) {
      return;
    }
    const daily = await strapi.documents(API_DAILY).findOne({
      documentId: result.documentId,
      populate: {
        first: true,
        second: true,
        dessert: true,
      },
    });
    
    if (!daily.first || !daily.second || !daily.dessert) {
      return;
    }

    const { SumPrecio, documentId, PriceWithTaxes } = daily;
    const sumPrice = await strapi.service(API_DAILY).priceDailyMenu(daily);

    const currentPrice = SumPrecio ?? 0;
    const calculatedPrice = sumPrice ?? 0;
    
    if (currentPrice.toFixed(2) !== calculatedPrice.toFixed(2)) {
      try {
        await strapi.documents(API_DAILY).update({
          documentId,
          data: { SumPrecio: sumPrice },
          state: { isCalculatedUpdate: true },
        });

      } catch (error) {console.error("Error updating TotalPriceDishes:", error);
      }
    }

    const price_with_taxes = await strapi.service(API_DAILY).includeTaxes(daily);
    const currentTaxes = typeof PriceWithTaxes === "number" ? PriceWithTaxes : parseFloat(PriceWithTaxes) || 0;
    const calculatedTaxes = typeof price_with_taxes === "number" ? price_with_taxes: parseFloat(price_with_taxes) || 0;

    if (currentTaxes.toFixed(2) !== calculatedTaxes.toFixed(2)) {
      try {
        await strapi.documents(API_DAILY).update({
          documentId,
          data: { PriceWithTaxes: price_with_taxes },
          state: { isCalculatedUpdate: true },
        });
      } catch (error) {
      }
    }
  }
};
