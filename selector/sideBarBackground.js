import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';

window.onload = function() {
  console.log("Starting Css Selector");
  ReactDOM.render(<App />, document.getElementById('appContainer'));
}

var selectorBuilder = {
  checkedSelectorFragments: [],
  computedSelector: "",
  addSelectorFragment: function(selectorFragment, rowIdx, precedenceAsc){
    this.defineIfNotAlready(rowIdx, precedenceAsc);
    this.checkedSelectorFragments[rowIdx][precedenceAsc].push(selectorFragment);
    this.recomputeSelector();
  },
  removeSelectorFragment: function(selectorFragment, rowIdx, precedenceAsc){
    this.defineIfNotAlready(rowIdx, precedenceAsc);
    var curFrags = this.checkedSelectorFragments[rowIdx][precedenceAsc];
    curFrags = curFrags.filter(function(val){
      return val != selectorFragment;
    });
    this.checkedSelectorFragments[rowIdx][precedenceAsc] = curFrags;
    this.recomputeSelector();
  },
  defineIfNotAlready: function(rowIdx, precedenceAsc){
    if(this.checkedSelectorFragments[rowIdx] == undefined){
      this.checkedSelectorFragments[rowIdx] = [];
    }
    if(this.checkedSelectorFragments[rowIdx][precedenceAsc] == undefined){
      this.checkedSelectorFragments[rowIdx][precedenceAsc] = [];
    }
  },
  clearSelector: function(){
    this.checkedSelectorFragments = [];
    this.computedSelector = "";
  },
  recomputeSelector: function(){
    function computeSelectorGivenFragments(checkedSelectorFragments){
      //test: computeSelectorGivenFragments([['a','b'],['c',undefined,'d'], undefined, [undefined, undefined, 'e','f',undefined], [undefined, undefined]])
      var computedSelector = "";
      checkedSelectorFragments.forEach((rowPrecedences) => {
        if(rowPrecedences != undefined){
          var addedAtLeastOne = false;
          //rowPrecedences.reverse();
          rowPrecedences.forEach((selectorFragments) => {
            selectorFragments.forEach((selectorFragment) => {
              if(selectorFragment != undefined){
                computedSelector += selectorFragment;
                addedAtLeastOne = true;
              }
            });
          });
          //rowPrecedences.reverse();
          if(addedAtLeastOne){
            computedSelector += " ";
          }
        }
      });
      return computedSelector.trim();
    }
    this.computedSelector = computeSelectorGivenFragments(this.checkedSelectorFragments);
  },
  getSelector: function(){
    return this.computedSelector;
  }
};
window.selectorBuilder = selectorBuilder;
