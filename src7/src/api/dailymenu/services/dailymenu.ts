/**
 * dailymenu service
 */

import { factories } from "@strapi/strapi";

const API_DAILY = "api::dailymenu.dailymenu";
const API_DISH = "api::dish.dish";
const taxes = 1.21;

export default factories.createCoreService(API_DAILY, () => ({
  priceDailyMenu: async function (dailymenu) {
    const { first, second, dessert } = dailymenu;
    let total = 0;
    if (first != null) {
      total = total + first.Price;
    }

    if (second != null) {
      total = total + second.Price;
    }

    if (dessert != null) {
      total = total + dessert.Price;
    }

    return total;
  },

  includeTaxes: async function (dailymenu) {
    const { Price } = dailymenu;
    const taxe = Price * taxes;
    return taxe.toFixed(2);
  },
  correctType: async function (params) {
    const typeDish = async (dish, type) => {
     
      if (dish && Array.isArray(dish.connect) && dish.connect.length > 0) {
        const dishSelect = await strapi.db.query(API_DISH).findOne({
          where: { id: dish.connect.map((item) => item.id) },
        });
        
        return dishSelect.Type === type;
      }
      return true
    };
    const isValidFirst = await typeDish(params.data.first, "First");
    if (!isValidFirst) return false;
    const isValidSecond = await typeDish(params.data.second, "Second");
    if (!isValidSecond) return false;
    const isValidDessert = await typeDish(params.data.dessert,"Dessert");
    if (!isValidDessert)
      {return false;}
    else{
      return true;
    }
  },
}));
