sap.ui.define([], function () {
	"use strict";
	return {
		
		editable:function(type){
			if(type === "O"){
				return false;
			}
            else{
                return true;
            }
		},
        visible:function(val){
            if(val === ""){
                return false;
            }
            else{
                return true;
            }
        }

	};
});