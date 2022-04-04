module.exports = {
    title: 'Vue3-ts-admin',
    description: '一个使用Vue3+TypeScript+Vue-router+Pinia+ElementPlus组件开发的后台管理系统',
    themeConfig: {
        nav: [
          { text: 'Github', link: 'https://github.com/sunburst89757/vue3-ts-admin' },
        ],
        sidebar: [
            {
                title: '介绍',
                path: "/guide/",
            },
            {
                title:"登录权限",
                path:"/guide/about-login",
            },
            {
                title: "tab栏的使用",
                path: "/guide/about-tab",
            }
          ]
      },
    base: "/vue3-ts-admin/"
  }