import test from 'node:test';
import assert from 'node:assert/strict';
import {parseKeymapDraft,emptyKeymapDraft,assignmentLabel} from '../src/lib/keymap-draft.ts';
test('Keymap drafts preserve independent Base/FN assignments without device codes',()=>{
 const d=emptyKeymapDraft();d.base.w={kind:'standard',target:'a'};d.fn.w={kind:'media',target:'play-pause'};d.base.f1={kind:'disabled',target:''};
 const actual=parseKeymapDraft(JSON.stringify(d));assert.deepEqual(actual,d);assert.equal(assignmentLabel(actual.base.w),'A');assert.equal(assignmentLabel(actual.fn.w),'Play / Pause');assert.equal(assignmentLabel(actual.base.f1),'Unassigned');
});
test('Invalid, prototype-like, unknown and mismatched keymap drafts cannot be restored',()=>{
 for(const value of ['null','{}','{"version":1,"base":{"__proto__":{"kind":"standard","target":"a"}},"fn":{}}',JSON.stringify({version:1,base:{w:{kind:'media',target:'a'}},fn:{}}),JSON.stringify({version:1,base:{knob:{kind:'standard',target:'a'}},fn:{}}),JSON.stringify({version:1,base:[],fn:{}}),JSON.stringify({version:2,base:{},fn:{}})])assert.throws(()=>parseKeymapDraft(value));
 assert.throws(()=>parseKeymapDraft(' '.repeat(100001)));
});
