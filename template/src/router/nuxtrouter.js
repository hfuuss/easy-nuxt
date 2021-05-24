import Vue from 'vue'
import Router from 'vue-router'
<% imports.forEach(function(item){%>
<%- item %>
<% }) %>


Vue.use(Router)
export function createRouter() {
  return new Router({
    mode: 'history',
    routes: <%- JSON.stringify(routes).replace(/\"(comp_\d_name)\"/g, '$1') %>,
  })
}