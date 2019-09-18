class Observer{
    constructor (data){
        this.observer(data);
    }

    observer (data){
        // 要对这个data数据将原有的属性改成 set 和 get 的形式
        if(!data || typeof data !== 'object'){
            return;
        }
        // 要将数据  全部劫持  先获取data  的 key 和value
        Object.keys(data).forEach(key =>{
            // 劫持
            this.defineReactive(data,key,data[key]);
            this.observer(data[key]);  // 递归劫持
        })
    }

    // 定义 set 和 get
    defineReactive (obj,key,value){
        let _this = this;
        let dep = new Dep();  // 每个变化的数据  都会对应一个数组  这个数组是存放所有更新的操作
        Object.defineProperty(obj,key,{
            enumerable: true,
            configurable: true,
            get (){  // 当取值调用的方法
                Dep.target && dep.addSub(Dep.target);
                return value;
            },
            set (newValue){  // 当给data属性中设置值的时候  更改获取属性的值
                if(newValue != value){
                    // 这里的this不是实例
                    _this.observer(newValue); // 如果是对象继续劫持
                    value = newValue;
                    dep.notify();  // 通知所有人  数据更新了
                }
            }
        })
    }
}

class Dep {
    constructor (){
        // 订阅的数组
        this.subs = [];
    }
    addSub (watcher){
        this.subs.push(watcher);
    }
    notify (){
        this.subs.forEach(watcher => watcher.update())
    }
}