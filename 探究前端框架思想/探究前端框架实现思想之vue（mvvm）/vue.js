class Vue{
    constructor(options) {
        this.$options = options;
        this._data = options.data;
        // 订阅数据
        this.observer(this._data);
        // 把数据映射到dom上
        this.compile(options.el);
    }
    observer(data){
        // 订阅data数据
        // console.log(data);
        // Object.keys(data).forEach((key)=>{
        //     let value = data[key];
        //     const newObj = Object.defineProperty(data,key,{
        //         // 可修改
        //         configurable: true,
        //         // 可遍历
        //         enumerable : true,
        //         get(){
        //             return value;
        //         },
        //         set(newValue){
        //             // 防止数据一样时依然赋值
        //             if(value !== newValue){
        //                 value = newValue;
        //             }
        //         }
        //     })
        //     // console.log(newObj === data); //true 这里证明数据劫持后的数据就是原来的数据
        // })
        // 现在数据变了但是数据没有映射到dom中，我们需要配合订阅发布者模式来通知重新生成dom, 
        // 所以上面注释调，我们先再下面实现一个订阅者类， 一个发布者类
        Object.keys(data).forEach((key)=>{
            let value = data[key];
            const dep = new Dep();
            Object.defineProperty(data , key , {
                configurable : true,
                enumerable : true,
                get(){
                    // 初始化订阅者列表， 如果传了vue实例，就添加到订阅者列表中， （默认target为空， 创建了订阅者（watcher实例）才会添加到subs中）
                    if(Dep.target){
                        dep.addSub(Dep.target);
                    }
                    return value
                },
                set(newValue){
                    if(value !== newValue){
                        value = newValue;
                        // 数据更新后我们调用发布者notify方法告知订阅者数据发生改变,并把新值传过去
                        dep.notify(newValue)
                    }
                }
            })
        })
    }
    compile(el){
        const element = document.querySelector(el);
        this.compileNode(element);
    }
    compileNode(element){
        const childNodes = element.childNodes;
        Array.from(childNodes).forEach((node)=>{

            if(node.nodeType === 3){
                // 文本节点时候
                let nodeContent = node.textContent;
                let reg = /\{\{\s*(\S*)\s*\}\}/;
                if(reg.test(nodeContent)){
                    // console.log(RegExp.$1);

                    // 没用订阅者注册之前的代码,默认data里面的数据
                    node.textContent = this._data[RegExp.$1];

                    // 创建一个订阅者实例，把修改后data里面的数据映射到文本节点上；
                    new Watcher(this, RegExp.$1, (newValue)=>{
                        console.log(newValue);
                        node.textContent = newValue;
                        // console.log(RegExp.$1);
                    })
                }
            }else if(node.nodeType === 1){
                // 元素节点时候，这里主要针对属性， v-model 双向绑定，其他的类似v-for v-if v-show v-bind等等有机会也可以自己尝试下
                let attrs = node.attributes;
                Array.from(attrs).forEach((attr)=>{
                    let attrName = attr.name;
                    let attrValue = attr.value;
                    if(attrName.indexOf('v-') !== -1){
                        attrName = attrName.substr(2);
                        if(attrName === 'model'){
                            node.value = this._data[attrValue];
                        }
                        node.addEventListener('input', (e)=>{
                            console.log(e.target.value);
                            this._data[attrValue] = e.target.value;
                        })
                        new Watcher(this, attrValue, (newValue)=>{
                            node.value = newValue;
                        })
                    }
                })
            }
            // 如果有多层节点
            if(node.childNodes.length > 0){
                this.compileNode(node);
            }


        })
    }
}

class Dep{
    constructor(){
        this.subs = [];
    }
    addSub(sub){
        this.subs = [...this.subs, sub];
    }
    notify(newValue){
        this.subs.forEach((sub)=>{
            sub.update(newValue);
        })
    }
}

class Watcher{
    // vm: 每个vue实例， exp: 正则匹配到的模版中的占位符， callback: 更新模版数据的回调函数
    constructor(vm,exp,callback){
        // target：一个flag，有才添加到发布者订阅列表中；
        Dep.target = this;
        vm._data[exp]; //初始化调用一下被劫持的对象中属性的值
        this.callback = callback;
        // 渲染完后重置为null，方便下一次添加订阅
        Dep.target = null;

    }
    update(newValue){
        console.log('数据更新啦！',newValue);
        this.callback(newValue);
    }
}