import Vue from '@/vue';

new Vue({
    el: '#app',
    data: {
        age: 18,
    },
    methods: {
        add() {
            this.age += 1;
        }
    }
})