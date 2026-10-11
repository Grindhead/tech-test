import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(file,deps){const source=readFileSync(new URL('../'+file,import.meta.url),'utf8');const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const exports={};vm.runInNewContext(code,{exports,require:name=>{if(!(name in deps))throw new Error(name);return deps[name];},console});return exports;}
class Container{children=[];addChild(child){this.children.push(child);child.parent=this;}sortChildren(){}removeChildren(){return this.children.splice(0);}}
class Sprite{anchor={set(){}};static from(){return new Sprite();}}
class Pool{constructor(factory){this.factory=factory;}get(){return this.factory();}release(){}}
let blocked=false;let moved=[];
class AnimationManager{isAnimating(){return blocked;}animate(card,id,settings,callbacks){moved.push(id);callbacks.onStart();callbacks.onComplete();}stopAll(){}}
const {CardManager}=load('src/components/CardManager.ts',{'pixi.js':{Container,Sprite},'../utils/ObjectPool':{ObjectPool:Pool},'../utils/AnimationManager':{AnimationManager}});
test('all 144 cards transfer before the source reverses',()=>{
 moved=[];const manager=new CardManager(new Container(),'card',144,10,15,1,0.5);
 for(let i=0;i<144;i++)assert.equal(manager.moveTopCard(),true);
 assert.equal(new Set(moved).size,144);assert.equal(moved[0],'card_143');assert.equal(moved[143],'card_0');
 for(let i=0;i<144;i++)assert.equal(manager.moveTopCard(),true);
 assert.equal(new Set(moved.slice(144)).size,144);assert.equal(moved[144],'card_0');assert.equal(moved[287],'card_143');
});
test('an animating source card is retried without reversing direction',()=>{
 moved=[];const manager=new CardManager(new Container(),'card',2,10,15,1,0.5);blocked=true;assert.equal(manager.moveTopCard(),false);blocked=false;assert.equal(manager.moveTopCard(),true);assert.equal(moved[0],'card_1');
});
const {DialogueManager}=load('src/components/magic-words/DialogueManager.ts',{'pixi.js':{Container},'./DialogueLineManager':{},'./EmojiManager':{},'./AvatarManager':{},'./ScrollManager':{}});
test('repeated relayout destroys old display trees while preserving shared textures',()=>{
 const manager=Object.create(DialogueManager.prototype);let destroyed=0;const sharedTexture={destroyed:false};
 const line=()=>({container:{height:20,destroy(options){assert.equal(options.children,true);assert.equal(options.texture,false);assert.equal(options.baseTexture,false);destroyed++;}},parts:[]});
 Object.assign(manager,{dialogueContainer:new Container(),linesData:[line(),line()],dialogueData:{dialogue:[{},{}]},styles:{textStyle:{fontSize:20},charTextStyle:{fontSize:20},missingEmojiStyle:{fontSize:20},lineSpacing:5},currentLineIndex:0,currentPartIndex:0,currentCharacterIndex:0,isTypingComplete:true,lineManager:{createDialogueLine:line,updateLineVisibility(){}},scrollManager:{updateContentHeight(){}},updateMask(){},calculateAvailableWidth(){return 300;}});
 for(const data of manager.linesData)manager.dialogueContainer.addChild(data.container);
 manager.resize(320,568);assert.equal(destroyed,2);manager.resize(568,320);assert.equal(destroyed,4);assert.equal(sharedTexture.destroyed,false);assert.equal(manager.dialogueContainer.children.length,2);
});
