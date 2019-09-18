class Compile{
    constructor (el,vm){
        this.el = this.isElementNode(el) ? el : document.querySelector(el);
        this.vm = vm;
        if(this.el){
            // 如果这个元素能获取到  我们才开始编译
            // 1. 先把这些真实的DOM移入到内存中  fragment
            let fragment = this.nodetofragment(this.el);

            // 2. 编译 => 提取想要的元素节点 v-model 和 文本节点 {{}}
            this.compile(fragment);
            // 把编译好的 fragment 再放回到页面去
            this.el.appendChild(fragment);
        }
    }
    /*  专门写一些辅助的方法 */
    isElementNode (node){
        return node.nodeType === 1;
    }

    // 是不是指令
    isDirective (name){
        return name.includes('v-');
    }
    /*  核心的方法 */
    compileElement (node){
        // 带 v-model
        let attrs = node.attributes;  // 取出当前节点的属性
        Array.from(attrs).forEach(attr =>{
            // 判断属性名字是不是包含v-
            let attrname = attr.name;
            if(this.isDirective(attrname)){
                // 取到对应的值放到节点中
                let expr = attr.value;
                let [, type] = attrname.split('-');
                // node this.vm.$data 
                CompileUtil[type](node,this.vm,expr);
            }
        })
    }

    compileText(node){
        // 带 {{}}
        let expr = node.textContent; // 取文本中的内容
        let reg = /\{\{([^}]+)\}\}/g;
        if(reg.test(expr)){
            // node this.vm.$data text
            CompileUtil['text'](node,this.vm,expr)
        }
    }

    compile(fragment){
        // 需要递归
        let childNodes = fragment.childNodes;
        Array.from(childNodes).forEach(node => {
            if(this.isElementNode(node)){
                // 是元素节点 还需要继续递归
                // 需要编译元素
                this.compileElement(node);
                this.compile(node);
            }else{
                // 文本节点
                // 需要编译文本
                this.compileText(node);
            }
        })
    }

    nodetofragment (el){  // 需要将 el 中的内容全部放到内存中
        // 文档碎片  内存中的dom节点
        let fragment = document.createDocumentFragment();
        let firstChild;
        while (firstChild = el.firstChild){
            fragment.appendChild(firstChild);
        }
        return fragment;  // 内存中的节点
    }    
}

CompileUtil = {
    getVal(vm,expr){
        expr = expr.split('.');
        return expr.reduce((prev,next)=>{  // vm.$data.a
            return prev[next];
        },vm.$data)
    },
    getTextVal(vm,expr){  // 获取编译文本后的结果
        return expr.replace(/\{\{([^}]+)\}\}/g,(...arguments)=>{ //function（a,b,c）一共可以传入3个参数，第一个为匹配的字符串，第二个为匹配字符串的起始位置，第三个为调用replace方法的字符串本身。可以缺省c或b、c。
            return this.getVal(vm,arguments[1]);
        });
    },
    text (node,vm,expr){  // 文本处理
        let updataFn = this.updater['textUpdater'];
        let value = this.getTextVal(vm,expr);

        expr.replace(/\{\{([^}]+)\}\}/g,(...arguments)=>{ 
            new Watcher(vm,arguments[1], (newValue)=>{
                // 如果数据节点变化，文本节点需要重新获取依赖的属性更新文本中的内容
                updataFn && updataFn(node, this.getTextVal(vm,expr))
            }) ;
        });
        

        updataFn && updataFn(node, value);
    },
    setVal(vm,expr,newValue){
        expr = expr.split('.');
        return expr.reduce((prev,next,currentIndex)=>{
            if(currentIndex === expr.length-1){
                return prev[next] = newValue;
            }
            return prev[next];
        },vm.$data)
    },
    model (node,vm,expr){  // 输入框处理
        let updataFn = this.updater['modelUpdater'];
        // 这里加一个监控  数据变化了  应该调用watcher 的 callback
        new Watcher(vm,expr,(newValue)=>{
            // 当值变化后会调用 cb 将新值传递过来  （）
            updataFn && updataFn(node,this.getVal(vm,expr));
        })
        node.addEventListener('input', (e)=>{
            let newValue = e.target.value;
            this.setVal(vm,expr,newValue)
        })
        updataFn && updataFn(node,this.getVal(vm,expr));  // 判断是否有该方法
    },
    updater: {
        // 文本更新
        textUpdater (node,value){
            node.textContent = value;
        },
        // 输入框更新
        modelUpdater (node,value){
            node.value = value;
        }
    }
}