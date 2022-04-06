# tab 栏的引入

## 总的原则

监听路由的变化实现 menu 与 tabs 的双向绑定。

## menu 的实现

1. menu 只需要点击能够实现跳转路由即可，这里跳转的方式，使用 click 还是直接用 el-menu 组件自身的 route 模式，取决于路由跳转是使用命名路由还是 path 直接跳，方便的程度与否取决于生成的菜单的结构。
2. 该系统的实现基于点击菜单事件实现路由跳转，跳转的方式是命名路由跳转。

## tabs 的引入的三个方案

三个方案的不同点只在于点击菜单，如何生成 tab 的改进，tab 上的切换实现都是相同的。

### tab 的存储原则

tabs 的所有数据存储在 tabStore 里，主要就是 tabs tabsActive menuActive acheComponents(keep-alive 缓存的组件 name)

### 方案一

1. 原则：点击菜单项将 tab 需要的信息构造成新的 tab 或者在原 tab 里进行切换。
2. 实现：
   - 点击菜单将菜单项对应的 title 和 path（实际是命名路由）构造新的 tab 给 tabStore.tabs 里，并进行路由跳转。
   - 表现形式上体现切换到指定的 tab，就将 tabActive 转为新的路由组件对应的名字上即可
   ```ts
   const sendMessageToTabs = (menuOption: tabType, event: any) => {
     menuActive.value = event.index;
     tabOption.title = menuOption.title;
     tabOption.path = menuOption.path;
     console.log("tabOption", tabOption);
     tabsStore.addTab(menuOption);
     router.push({
       name: menuOption.path,
     });
   };
   ```
3. 缺点：将 menu 组件和 tabs 组件高度绑定了，点击 menu 需要传递给 tabs 组件相应信息。

### 方案二

1. 原则：tab 下存储的组件表现形式实际只是不同路由切换的结果，因此可以考虑分离 tab 和 menu 的耦合关系，点击 menu 只进行路由跳转，可以在 layout 组件下只监听路由变化即可，路由变化来考虑是否新增 tab。
2. 实现
   - layout 组件下监听 route，route 发生变化，route.name 和 route.meta.name 存储有构造 tab 的信息
3. 缺点：
   - layout 组件监听 route 实现了菜单情况下 spa 页面的 tab 增加，但是在退出登录时会也监听到了 login 这个路由也会新增到 tabs 内部，下次登录的时候就会出现登录这个选项卡就会出现在 tab 栏里。
   ```ts
   watch(route, (newRoute) => {
     tabsStore.handleTab(newRoute);
   });
   ```

### 方案三

1. 原则： 选择将路由变化放在路由拦截器里处理.
2. 实现：路由拦截分为了以下几种情况，只需要在后两种情况下操纵 tab 即可，特殊情况如刷新，404 页面，route 都会匹配两次，也会操作 tab，这两种情况下第一次匹配都会出现 route.name 都是 undefined，再单独给 404 路由不设置 name，就可以实现只有 spa 与 tab 相关。

- 去登录页面
- 第一次来到首页（刷新页面）
- 正常的切换到不同的页面

```ts
  <!-- 拦截器 -->
    router.beforeEach(async (to, from, next) => {
    const token = cache.getCache("token");
    if (to.path !== "/login") {
      if (!token) {
        router.push("/login");
      } else {
        console.log("查询to对象", to);

        const userStore = useUserStore();
        // 登录或者刷新的时候
        if (!userStore.role) {
          await userStore.getUserRole();
          generateAccessRoutes(userStore.role, asyncRoutes);
          // 注册动态路由
          asyncRoutes.forEach((element) => {
            router.addRoute(element);
          });
          userStore.generateUserMenus();
          // 不使用 next() 是因为，在执行完 router.addRoute 后，
          // 原本的路由表内还没有添加进去的路由，会 No match
          // replace 使路由从新进入一遍，进行匹配即可
          next({ ...to, replace: true });
        } else {
          next();
        }
        generateMenuAndTab(to);
      }
    } else {
      next();
    }
  });
  <!-- handleTab -->
  handleTab(route: RouteLocationNormalizedLoaded) {
    // 刷新时，因为没有动态注册路由，所以匹配不到路由，对应的path和name就都是undefined，这不能添加到tab上
    console.log("zhixinghandle", route);

    if (!route.name) {
      return;
    }
    if (!this.isTabInTabs(route.name as RouteRecordName)) {
      const tab = {
        title: route.meta.name as string,
        path: route.name as RouteRecordName
      };
      this.addTab(tab);
    } else {
      // 已有的tab，重置tab状态
      // console.log(route.name, "名字");
      this.tabActive = String(route.name);
      this.menuActive = this.tabActive;
      return;
    }
  }

```

## tabs 的实现

1. 原则：真正菜单对应的路由组件并没有放在 el-tab-panel 下，watch 在通用布局组件 layout 下面监听 route，route 发生变化，说明 tab 会出现相应的变化操作。不同 tab 的页面应该处于缓存状态，所以应该用 keep-alive 缓存状态，但是在关闭 tab 的时候相应的也需要对不用的组件进行销毁，这里不采取 destroy 来销毁组件，采用对 router-view 使用 include 来选择包含的组件进行缓存，关闭 tab 就移出。

   ```tsx
   			// layout.vue 在这个页面监听路由的变化
   			<el-main class="main">
             <div class="nav-tabs">
               <nav-tabs></nav-tabs>
             </div>
             <router-view v-slot="{ Component }" >
               <transition>
                 <keep-alive :include="cacheComponents" :max="10">
                   <component :is="Component" />
                 </keep-alive>
               </transition>
             </router-view>
           </el-main>

   				const route = useRoute();
   				const tabsStore = useTabStore();
   				const { cacheComponents } = storeToRefs(tabsStore);
   ```

2. 操作 Tab:Tab 的数据全部存储在 store/tabStore 下

   - handleTab: 将路由拦截的路由对象 to 传递过来判断即可，判断是否是新增还是跳转即可。

3. 删除 tab
   1. 删除后，选中的路由应该是上一个 tab 对应的路由路径
   2. 删除最后一个自动对应首页对应的路由
4. 点击 tab 实现路由的切换管理：直接点击的时候实现路由跳转即可，修改菜单的选中状态即可实现。

**_这里还存在问题：_**路由组件存放在 el-tab-pannel 下会出现下面情况，有几个 tab 页面，选中其中一个 tab 页，它对应的组件 setup 会执行几次；具体来说有三个 tab 页 a,b,c，点击 a，**_a 页面的 setup 会执行三次，具体情况未知待测_**。
