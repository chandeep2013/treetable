sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "com/tr/runtreetable/model/formatter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,formatter) {
        "use strict";

        return Controller.extend("com.tr.runtreetable.controller.View1", {
            formatter: formatter,
            onInit: function() {
                /*var sPath = jQuery.sap.getModulePath("com..treetable", "/model/data.json"); 
                var oMydata = new sap.ui.model.json.JSONModel(); 
                oMydata.loadData(sPath,false); 
                console.log(JSON.stringify(oMydata.getData()));
                this.getView().setModel(oMydata,"oModelData");*/
                var flatData = this.readFile();
                var deepData = this.transformTreeData(flatData);
                this.setModelData(deepData);
            },
            readFile: function() {
    
                var flatData = null;
                var sPath = jQuery.sap.getModulePath("com.tr.runtreetable", "/model/data.json");
                var inModel = new sap.ui.model.json.JSONModel();
                inModel.loadData(sPath, "", false);
                var data = inModel.getData();
                if (data) {
                    flatData = data.nodes;
                }
                return flatData;
            },
    
            transformTreeData: function(nodesIn) {
    
                var nodes = []; //'deep' object structure
                var nodeMap = {}; //'map', each node is an attribute
    
                if (nodesIn) {
    
                    var nodeOut;
                    var parentId;
    
                    for (var i = 0; i < nodesIn.length; i++) {
                        var nodeIn = nodesIn[i];
                        nodeOut = {
                            id: nodeIn.ID,
                            text: nodeIn.Text,
                            type: nodeIn.Type,
                            children: [],
                            Credit:nodeIn.Credit,
                            Debit:nodeIn.Debit,
                            ProfitCenter:nodeIn.ProfitCenter,
                            CostCenter:nodeIn.CostCenter,
                            Account:nodeIn.Account
                        };
                        parentId = nodeIn.ParentID;
                        if (parentId && parentId.length > 0) {
                            //we have a parent, add the node there
                            //NB because object references are used, changing the node
                            //in the nodeMap changes it in the nodes array too
                            //(we rely on parents always appearing before their children)
                            var parent = nodeMap[nodeIn.ParentID];
    
                            if (parent) {
                                parent.children.push(nodeOut);
                            }
                        } else {
                            //there is no parent, must be top level
                            nodes.push(nodeOut);
                        }
    
                        //add the node to the node map, which is a simple 1-level list of all nodes
    
                        nodeMap[nodeOut.id] = nodeOut;
    
                    }
    
                }
    
                return nodes;
            },
            setModelData: function(nodes) {
                //store the nodes in the JSON model, so the view can access them
                var nodesModel = new sap.ui.model.json.JSONModel();
                nodesModel.setData({
                    nodeRoot: {
                        children: nodes
                    }
                });
                this.getView().setModel(nodesModel, "nodeModel");
                var oTreeTable = this.getView().byId("TreeTable");
                oTreeTable.expandToLevel(1);
            },
            
            onSelectCheckBoxTreeTable: function (oEvent) {
                var oObject = {};
                var oTable = this.getView().byId("TreeTable");
                var oSelectedItem = oTable.getContextByIndex(oEvent.getSource().getParent().getIndex());
                var oModel = this.getView().getModel("nodeModel");;
                //oObject.path = oEvent.getSource().getBindingContext().sPath;
                oObject.path = oSelectedItem.getPath();
                oObject.object = oModel.getObject(oObject.path);
                this.selectedPath = oObject.path;
                if (oObject.object.children !== undefined) {
                    //if is not leef
                    this.selectedTopDownModel(oObject);
                    if (!oObject.object.selected) {
                        var sPath = oObject.path;
                        this.selectedBottomUpModel(oObject, sPath);
                    }
                } else {
                    //if is leef
                    var sPath = oObject.path;
                    this.selectedBottomUpModel(oObject, sPath);
                }
            },
            selectedTopDownModel: function (oObject) {
                var bSelected = oObject.object.selected;
                var aElement = oObject.object.children;
                for (var i = 0; i < aElement.length; i++) {
                    if (aElement[i].edit || aElement[i].edit === undefined)
                        aElement[i].selected = bSelected;
                    if (aElement[i].children !== undefined) {
                        var oElementObject = {
                            object: aElement[i]
                        };
                        this.selectedTopDownModel(oElementObject);
                    }
                }
            },
            selectedBottomUpModel: function (oObject, sPath) {
                var oModel = this.getView().getModel();
                var aSplitPath = sPath.split("/");
                aSplitPath.pop();
                aSplitPath.pop();
                sPath = aSplitPath.join('/');
                var oParetnObject = oModel.getObject(sPath);
                if (oParetnObject.selected && !oObject.selected) {
                    oParetnObject.selected = false;
                    this.selectedBottomUpModel(oParetnObject, sPath);
                }
            },
            toggleOpenState: function(evt) {
    
                var oTable = this.getView().byId("TreeTable");
                //var oSelectedItem = oTable.getContextByIndex(oTable.getSelectedIndex()).getObject();
                var path = evt.getParameter('rowContext').getPath();
                var oSelectedItem = this.getView().getModel("nodeModel").getProperty(path);
                if(oSelectedItem.type !=='O'&&evt.getParameter('expanded') && this.previousId !== oSelectedItem.id){
                    this.previousId = oSelectedItem.id;                ;
                    this._updateDataModel(oSelectedItem, oTable.getSelectedIndex());
                }
            },
            _updateDataModel: function(oSelectedItem, Index) {
    
                var oRoot = this.getView().getModel("nodeModel").getProperty("/children");
                var oNewData = {};
                if (oSelectedItem) {
                    oNewData = {
                            "id": oSelectedItem.children[oSelectedItem.children.length-1].id+1,
                            "text": "New",
                            "type": "S",
                            "children": [],
                            "Credit":"NewCredit",
                            "Debit":"NewDebit",
                            "ProfitCenter":"NewProfit",
                            "CostCenter":"NewCost",
                            "Account":"NewAccount"
                    };
                    oSelectedItem.children.push(oNewData);
                } 
                this.getView().getModel("nodeModel").refresh();
                
            },
            onValueHelpRequestProfitCenter: function() {
                var that = this;
                if (!this._oDialogProfitCenter) {
                    that._oDialogProfitCenter = sap.ui.xmlfragment("com.tr.runtreetable.view.ProfitCenter_F4Help", that);
                    that.getView().addDependent(that._oDialogProfitCenter);
                }
                that._oDialogProfitCenter.open();
            },
            onProfitCenterCancel:function(){
                this._oDialogProfitCenter.close();
            },
            onValueHelpRequestCostCenter: function() {
                var that = this;
                if (!this._oDialogCostCenter) {
                    that._oDialogCostCenter = sap.ui.xmlfragment("com.tr.runtreetable.view.CostCenter_F4Help", that);
                    that.getView().addDependent(that._oDialogCostCenter);
                }
                that._oDialogCostCenter.open();
            },
            onCostCenterCancel:function(){
                this._oDialogCostCenter.close();
            },
            onProfitCenterF4HelpSelect: function(evt) {
                var aSelectedItems = sap.ui.getCore().byId("idF4HelpProfitCenterTable").getSelectedItems(),
                    oMultiInput = this.getView().byId("idSelectedProfitCenter");
                this.getView().byId("idSelectedProfitCenter").setTokens([]);
                if (aSelectedItems && aSelectedItems.length > 0) {
                    aSelectedItems.forEach(function(oItem) {
                        oMultiInput.addToken(new Token({
                            text: oItem.getCells()[0].getText()
                        }));
                    });
                }
                this._oDialogProfitCenter.close();
            },
            onCostCenterF4HelpSelect:function(evt){
    
                var aSelectedItems = sap.ui.getCore().byId("idF4HelpCostCenterTable").getSelectedItems(),
                    oMultiInput = this.getView().byId("idSelectedCostCenter");
                this.getView().byId("idSelectedCostCenter").setTokens([]);
                if (aSelectedItems && aSelectedItems.length > 0) {
                    aSelectedItems.forEach(function(oItem) {
                        oMultiInput.addToken(new Token({
                            text: oItem.getCells()[0].getText()
                        }));
                    });
                }
                this._oDialogCostCenter.close();
            },
            OnSearchCostCenter: function() {
                //var sQuery = oEvent.getParameter("query");
                var sQuery = sap.ui.getCore().byId("idSearchCostCenter").getValue();
                var Title = new sap.ui.model.Filter("CostCenter_ID", sap.ui.model.FilterOperator.Contains, sQuery);
                var Desc = new sap.ui.model.Filter("CostCenterText", sap.ui.model.FilterOperator.Contains, sQuery);
                var filters = new sap.ui.model.Filter([Title, Desc]);
                var listassign = sap.ui.getCore().byId("idF4HelpCostCenterTable");
                listassign.getBinding("items").filter(filters, "Appliation");
            },
            OnSearchProfitCenter: function() {
                //var sQuery = oEvent.getParameter("query");
                var sQuery = sap.ui.getCore().byId("idSearchProfitCenter").getValue();
                var Title = new sap.ui.model.Filter("ProfitCenter_ID", sap.ui.model.FilterOperator.Contains, sQuery);
                var Desc = new sap.ui.model.Filter("ProfitCenterText", sap.ui.model.FilterOperator.Contains, sQuery);
                var filters = new sap.ui.model.Filter([Title, Desc]);
                var listassign = sap.ui.getCore().byId("idF4HelpProfitCenterTable");
                listassign.getBinding("items").filter(filters, "Appliation");
            },
            onSimulate:function(){
                var that = this;
                var selectedData = this.getView().getModel("nodeModel").getObject(this.selectedPath);
                var simulateModel = new sap.ui.model.json.JSONModel();
                var simulatedData = selectedData.children;
                simulatedData[0].companycodeText = selectedData.text;
                simulateModel.setData(simulatedData);
                this.getView().setModel(simulateModel, "simulateModel");

                if (!this._oDialogSimulate) {
                    that._oDialogSimulate = sap.ui.xmlfragment("com.tr.runtreetable.view.simulate", that);
                    that.getView().addDependent(that._oDialogSimulate);
                }
                that._oDialogSimulate.open();
            },
            onCancelJE:function(){
                this._oDialogSimulate.close();
            }
        });
    });
