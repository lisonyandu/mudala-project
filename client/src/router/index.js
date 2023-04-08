import { createRouter, createWebHistory } from "vue-router";
import App from "../App.vue";

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes: [
        {
            path: "/",
            name: "app",
            component: App,
            children: [
                {
                    path: "",
                    name: "home",
                    component: () => import("../components/HomePage.vue"),
                },
                {
                    path: "exchange",
                    name: "exchange",
                    component: () => import("../components/MarketPage.vue"),
                    props: (route) => ({ title: route.query.q }),
                },
                {
                    path: "regulator",
                    name: "regulator",
                    component: () => import("../components/ValidatorPage.vue"),
                    props: (route) => ({ title: route.query.q }),
                },
                {
                    path: "member",
                    name: "member",
                    component: () => import("../components/MemberPage.vue"),
                    props: (route) => ({ title: route.query.q }),
                },
                {
                    path: "empty",
                    name: "empty",
                    component: () => import("../components/EmptyPage.vue"),
                    props: (route) => ({ title: route.query.q }),
                },
            ],
        },
    ],
});

export default router;
