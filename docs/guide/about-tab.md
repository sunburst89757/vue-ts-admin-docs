# tab栏的引入

## 一、总的原则：监听路由的变化实现menu与tabs的双向绑定。

## 二、menu的实现

1. menu只需要点击能够实现跳转路由即可，这里跳转的方式，使用click还是直接用el-menu组件自身的route模式，取决于路由跳转是使用命名路由还是path直接跳，方便的程度与否取决于生成的菜单的结构。

## 三、tabs的实现

1. 原则：真正菜单对应的路由组件并没有放在el-tab-panel下，watch在通用布局组件layout下面监听route，route发生变化，说明tab会出现相应的变化操作。不同tab的页面应该处于缓存状态，所以应该用keep-alive缓存状态，但是在关闭tab的时候相应的也需要对不用的组件进行销毁，这里不采取destroy来销毁组件，采用对router-view使用include来选择包含的组件进行缓存，关闭tab就移出。
    
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
    				watch(route, () => {
    				  // 这里路由跳转会响应两次原因暂时未知
    				  console.log("监听route", route);
    				  tabsStore.handleTab(route);
    				});
    ```
    
2. 操作Tab:只要在页面整体布局的组件layout下监听route就触发操作tab。（点击菜单引起的）
    1. 例外情况：
        1. 退出登录的时候，路由会出现/login,这是不能存放在tab里，所以要单独处理判断
    
     b.  监听路由的变化只会出现是否新增tab的操作，关于tab的所有状态和存储全部放在store里进行管理，已经存在于tab的就不在新增，存在就新增。
    
3. 删除tab
    1. 删除后，选中的路由应该是上一个tab对应的路由路径
    2. 删除最后一个自动对应首页对应的路由
4. 点击tab实现路由的切换管理：直接点击的时候实现路由跳转即可，修改菜单的选中状态即可实现。

***这里还存在问题：***路由组件存放在el-tab-pannel下会出现下面情况，有几个tab页面，选中其中一个tab页，它对应的组件setup会执行几次；具体来说有三个tab页a,b,c，点击a，***a页面的setup会执行三次，具体情况未知待测***。