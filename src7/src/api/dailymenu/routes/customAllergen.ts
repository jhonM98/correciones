export default {
  routes: [
    {
      method: "GET",
      path: "/dailymenu/:nameAllergen",
      handler: "dailymenu.excludeAllergens",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
        method: "GET",
        path: "/dailymenu/",
        handler: "dailymenu.mostPopular",
        config: {
          policies: [],
          middlewares: [],
        },
      },
  ],
};
