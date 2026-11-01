import test from 'node:test';import assert from 'node:assert/strict';
import {APP_PAGES,pageFromHash} from '../src/lib/app-navigation.ts';
test('All existing pages support stable hash links for review and bookmarking',()=>{
 assert.equal(APP_PAGES.length,9);for(const page of APP_PAGES){assert.equal(pageFromHash(`#/${page}`),page);assert.equal(pageFromHash(`#${page}`),page);}
});
test('Unknown or executable-looking locations fall back to Overview',()=>{
 for(const hash of ['', '#/', '#/missing', '#/lighting/extra','#/javascript:alert(1)','#/actuation?write=true'])assert.equal(pageFromHash(hash),'dashboard');
});
