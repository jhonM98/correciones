/**
 * dailymenu controller
 */
import { factories } from "@strapi/strapi";

const API_DAILY = "api::dailymenu.dailymenu";
const API_DISH = "api::dish.dish";

export default factories.createCoreController(API_DAILY, () => ({
  async excludeAllergens(ctx) {
    const { nameAllergen } = ctx.params;

    const namesArray = nameAllergen.split(",").map((name) => name.trim());

    const dailyMenus = await strapi.documents(API_DAILY).findMany({
      populate: {
        first: {
          populate: {
            Allergen: true,
          },
        },
        second: {
          populate: {
            Allergen: true,
          },
        },
        dessert: {
          populate: {
            Allergen: true,
          },
        },
      },
    });

    const functionAllergen = (dish) => {
      if (!dish || !dish.Allergen || dish.Allergen.length === 0) {
        return false;
      }
      for (let allergen of dish.Allergen) {
        if (namesArray.includes(allergen.Name)) {
          return true;
        }
      }
      return false;
    };
    const filteredMenus = dailyMenus.filter((menu) => {
      return (
        !functionAllergen(menu.first) &&
        !functionAllergen(menu.second) &&
        !functionAllergen(menu.dessert)
      );
    });

    return ctx.send(filteredMenus);
  },

  async mostPopular(ctx) {
    const dailyMenus = await strapi.documents(API_DAILY).findMany({
      populate: {
        first: true,
        second: true,
        dessert: true,
      },
    });

    const countMap = new Map<string, number>();
    for (let menu of dailyMenus) {
      if (countMap.has(menu.first.Name)) {
        countMap.set(menu.first.Name, countMap.get(menu.first.Name)! + 1);
      } else {
        countMap.set(menu.first.Name, 1);
      }

      if (countMap.has(menu.second.Name)) {
        countMap.set(menu.second.Name, countMap.get(menu.second.Name)! + 1);
      } else {
        countMap.set(menu.second.Name, 1);
      }

      if (countMap.has(menu.dessert.Name)) {
        countMap.set(menu.dessert.Name, countMap.get(menu.dessert.Name)! + 1);
      } else {
        countMap.set(menu.dessert.Name, 1);
      }
    }

    const dishes = await strapi.documents(API_DISH).findMany({});

    const result = [];

    for (let [name, count] of countMap.entries()) {
      const dish = dishes.find((d) => d.Name === name);

      if (dish) {
        result.push({
          name: dish.Name,
          price: dish.Price,
          type: dish.Type,
          count: count,
        });
      }
    }
    result.sort((a, b) => b.count - a.count);

    return ctx.send(result);
  },
}));
