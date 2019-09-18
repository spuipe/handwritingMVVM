class Watcher {
    constructor (vm,expr,cb){
        this.vm = vm;
        this.expr = expr;
        this.cb = cb;
        // 先获取老值
        this.value = this.get();
    }
    getVal(vm,expr){
        expr = expr.split('.');
        return expr.reduce((prev,next)=>{  // vm.$data.a
            return prev[next];
        },vm.$data)
    }
    get (){
        Dep.target = this;
        let value = this.getVal(this.vm,this.expr);
        Dep.target = null;
        return value;
    }
    // 对外暴露的方法
    update (){
        let newValue = this.getVal(this.vm,this.expr);
        let oldValue = this.value;
        if(newValue != oldValue){
            this.cb(newValue);  // 调用 watch 的callback
        }
    }
}
// 用新值和老值比对  如果发生变化 就调用更新方法
// vm.$data  expr