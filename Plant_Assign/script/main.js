require(["DS/DataDragAndDrop/DataDragAndDrop", "DS/PlatformAPI/PlatformAPI", "DS/WAFData/WAFData", "DS/i3DXCompassServices/i3DXCompassServices","Plant/script/table"], 
	function(DataDragAndDrop, PlatformAPI, WAFData, BaseUrl,whereUsedTable) {
		
		var urlBASE,csrfToken,securityContext;
		var ProductType
		var sMainPartId,InitialAssignedClasses,cestamp,ALLClasses,productChilds;
		var hasInWorkCA = false;
		var partState = "";
		securityContext= "ctx%3A%3AVPLMProjectAdministrator.BU-0000001.Micro%20Motion",
		urlBASE = "";


		//------
		console.log("krishna-Inside-1111111111111111111->");
		var comWidget = {
			onLoad: function() { 

				console.log("krishna-Inside-->");
				// Create a dropbox for drag-and-drop functionality
				var dropbox = widget.createElement('div', { 'class' : 'mydropclass', 'text' : ''});
				var dropimage = widget.createElement('img', { 'src': 'https://krishnaprasadarisetty.github.io/SLK_Boss_ATT/BO_ATT/Images/dropImage.png', 'alt': 'Dropbox Image' });
				dropbox.append(dropimage);
				var dropboxsep = widget.createElement('div', { 'class' : 'dropboxsep', 'text' : '-- or --' });
				dropboxsep.style= "font-size: 12px; color:rgb(202, 228, 242); text-align: center";
				dropbox.append(dropboxsep);
				var button = document.createElement('button', {'class':'dynamic-button'});

				button.style = "padding: 10px 20px; font-size: 14px; text-align: center; margin: 10px; background-color: #368ec4; color: white; border: none; cursor: pointer";
				button.innerHTML = 'Open content';
				dropbox.append(button);
				dropbox.style = "border:2px #c6c5c5 dashed; margin:10px; padding: 5%; text-align: center";
				widget.body.innerHTML="";
				dropbox.inject(widget.body);
				//
				comWidget.setBaseURL();

				//==========
				
				
				// Set up drag-and-drop functionality
				var theInput = widget.body.querySelector('.mydropclass');
				DataDragAndDrop.droppable(theInput, {
					drop: function(data) {
						const objs = JSON.parse(data);
						let objList = objs.data.items;
						let objsLength = objList.length;
						if (objsLength > 1) {
							alert("Please drop only one Product.");
							return;
						}
						const PartId = objList[0].objectId;
						sMainPartId = PartId;
						ProductType = objList[0].objectType;
						console.log("objectType---->", ProductType);
						console.log("objList---->", objList);
						if ("VPMReference"!=ProductType && "Raw_Material"!=ProductType ) {
							alert("Please drop only Physical Products or Raw Materials");
							return;
						}
						console.log("PartId dropped:", PartId);	
						var dataResp3 = comWidget.getPartDetails(PartId);
						console.log("dataResp3---->", dataResp3);
						
						let partName = dataResp3.member[0].name;
						let partTitle = dataResp3.member[0].title;
						let partCollabSpace  = dataResp3.member[0].collabspace;
						partState  = dataResp3.member[0].state;
						console.log("partName---->", partName);
						console.log("partTitle---->", partTitle);
						
						hasInWorkCA = comWidget.checkInworkCA(PartId,partState);
						console.log("hasInWorkCA---->"+hasInWorkCA);
						
						comWidget.partDropped(PartId,partName,partTitle,partCollabSpace);						
					},
				});
			},
			classifyProduct : function(sClassId,sPartid) {
				let urlObjWAF = urlBASE+"resources/v1/modeler/dslib/dslib:ClassifiedItem";
				let stype = "VPMReference";
				let sRefPath = "/resources/v1/modeler/dseng/dseng:EngItem/";
				if ( "Raw_Material" == ProductType ) {
					stype = "Raw_Material";
					sRefPath = "/resources/v1/modeler/dsrm/dsrm:RawMaterial/";
				}
				let body = {
					"ClassID": sClassId,
					"ObjectsToClassify": [
					  {
						"source": urlBASE.slice(0, -1),
						"type": stype,
						"identifier": sPartid,
						"relativePath": sRefPath+sPartid
					  }
					]
				  };
				return comWidget.callwebService("POST",urlObjWAF,JSON.stringify(body));
			},
			checkInworkCA : function(sPartid,partState) {				
				let resObejct = false;
				let urlObjWAF = urlBASE+"resources/enorelnav/v2/navigate/setPreferences";
				let body  = {"widgetId":"ENORIPE_Relations_Preview_2751_2038-15:33:22",
							"relations":["caproposedwhere_from"],
							"allRelationsMode":false,
							"publicationsMode":false,
							"computeWithInstances":false,
							"attributesForView":["ds6w:status","ds6w:type","ds6w:identifier"],
							"label":"ENXENG_AP-e1331143-1734517777960","lang":"en","ghostMode":false};
				let response = comWidget.callwebService("POST",urlObjWAF,JSON.stringify(body));
				if (response.status) {
					let url2 = urlBASE+"/resources/enorelnav/v2/navigate/getEcosystem";
					let bd = {"widgetId":"ENORIPE_Relations_Preview_2751_2038-15:33:22",
								"responseMode":"objectsByPatterns",
								"label":"ENXENG_AP-e1331143-1734517780491",
								"ids":[sPartid]};
					let respon = comWidget.callwebService("POST",url2,JSON.stringify(bd));
					if (respon.status) {
						if(respon.output.objectsByPatterns.caproposedwhere_from){
							//Iterate over CA's connected to object
							respon.output.objectsByPatterns.caproposedwhere_from.forEach(itm => {
								const status = itm["ds6w:status"].slice(14);
								//check only not completed CA.. need to check if in appproval state also TBD
								if(status !== "Complete") {
									if(partState==="RELEASED"){
										let sCAResult = comWidget.getCAdetails(itm.id);
										//get CA details and check if our part added as proposed item
										if (sCAResult.status){
											sCAResult.output.proposedChanges.forEach(obj => {
												if (obj.where.identifier === sPartid) {
													const action =obj.whats[0].what;
													//check if action is modify if part is released...
													if(action==="Modify"){
														resObejct = true;
													}
													
												}
											});
										}
									} else {
										resObejct = true;
									}
								} 
								
							});
						}
					}
					
				}
				return resObejct;
			},
			AddPlantPopup : function(){
				if(hasInWorkCA){
					let assignedTable = whereUsedTable.AssigendPlantTableData;
					let allRows = assignedTable.getData();
					let maxId = Math.max(...allRows.map(row => row.id)) + 1;
					console.log("maxId===="+maxId);
					let selectedRows = whereUsedTable.AvaliablePlantTableData.getSelectedRows();
					if (selectedRows.length > 0) {  // Check if any rows are selected
						selectedRows.forEach((row,index) => {
							let rowData = row.getData();
								console.log("plant---->"+rowData.Plant);
									assignedTable.addRow({ 
										id: maxId+index, Plant: rowData.Plant, Seq:"1",Status:"Current",MFG_Change: "", MFG_Status: "",Change:"", Change_Status:"", Oracle_Template:"", ERP_Status:"Active",ERP_Export:"No", Lead_Plant:"false", MBom:"Buy", Sort_Value:""
									});
							row.delete();
						});
					} else {
						alert("Please select at least one row from available plants");  // Show alert if no rows are selected
					}
				} else if(partState==="RELEASED"){
					alert("Change Action is required to assign plants to Product, please assign Modify change Action and try again"); 
				} else {
					alert("Change Action is required to assign plants to Product, please assign change Action and try again"); 
				}
			},
			callwebService: function(methodWAF,urlObjWAF,data) 
			{
				var headerWAF = {
					SecurityContext: securityContext,
					Accept: "application/json",
					ENO_CSRF_TOKEN : csrfToken,
					"Content-Type": "application/json"
				};
				console.log("headerWAF----"+headerWAF);
				let returnobj = {};
				let dataResp=WAFData.authenticatedRequest(urlObjWAF, {
					method: methodWAF,
					headers: headerWAF,
					data: data,
					type: "json",
					async : false,
					onComplete: function(dataResp) {
						returnobj.status = true;
						returnobj.output = dataResp;
						console.log("kp--CallWebService--- >> ",dataResp);
					},
					onFailure: function(error, backendresponse, response_hdrs) {
						console.log("Failedddddd",error.message);
						returnobj.status = false;
						console.log(response_hdrs);
						widget.body.innerHTML += "<p>Something Went Wrong"+error+"</p>";
					}
				})
				
				return returnobj;
			},
			exportTable: function(filename){
				
				let csvContent = "TESTTTTTTTT";
				const rows = parttable.rows;
				/*
				for (let i =0; i<rows.lenght; i++) {
					const row = rows[i];
					const rowData = [];
					for (let j =0; j<rows.lenght; j++){
						rowData.push(row.cell[j].innerHTML);
					}
					csvContent += rowData.join() + '/n';
				}
					*/
				//Create Download link
				let hiddenElement = widget.createElement('a');
				hiddenElement.href = 'data:text/csv/charset=utf-8,' + encodeURI(csvContent);
				hiddenElement.target = '_blank';
				hiddenElement.download = filename;
				hiddenElement.click();
			},
			
			setBaseURL: function() 
			{
				BaseUrl.getServiceUrl( { 
					platformId:  widget.getValue('x3dPlatformId'),
					serviceName: '3DSpace', 
					onComplete :  function (URLResult) {
						urlBASE = URLResult+"/";
						//urlBASE = "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/";
						console.log("aaaaaaaaaaaaaaaaa-1111-----URL",urlBASE);
						comWidget.setCSRF();
					},
					onFailure:  function( ) { alert("Something Went Wrong");
					}
				}) ; 
			},
	
			setCSRF: function() {
				console.log("aaaaaaaaaaaaaaaaa-2222-----URL");
				// Web Service call to get the crsf token (security) for the current session
				let urlWAF = urlBASE+"resources/v1/application/CSRF";
				let dataWAF = {};
				let headerWAF = {};
				let methodWAF = "GET";
				let dataResp=WAFData.authenticatedRequest(urlWAF, {
					method: methodWAF,
					headers: headerWAF,
					data: dataWAF,
					type: "json",
					async : false,
					onComplete: function(dataResp) {
						// Save the CSRF token to a hidden widget property so it can be recalled
						let csrfArr=dataResp["csrf"];
						csrfToken = csrfArr["value"];
						console.log("aaaaaaaaaaaaaaaaa------csrfToken",csrfToken);
					},
					onFailure: function(error) {
						widget.body.innerHTML += "<p>Something Went Wrong- "+error+"</p>";
						widget.body.innerHTML += "<p>" + JSON.stringify(error) + "</p>";
					}
				});
			},
			getPartDetails: function(PartId) 
			{
				var headerWAF = {
					ENO_CSRF_TOKEN: csrfToken,
					//SecurityContext: "ctx%3A%3AVPLMProjectLeader.BU-0000001.Rosemount%20Flow",
					SecurityContext: securityContext,
					Accept: "application/json",
					'Content-Type': 'application/json'
				};
				var methodWAF = "GET";
				// Web Service for getting Test Case Object Detail
				var urlObjWAF = urlBASE+"resources/v1/modeler/dseng/dseng:EngItem/";
				if (ProductType == "Raw_Material") {
					urlObjWAF = urlBASE+"resources/v1/modeler/dsrm/dsrm:RawMaterial/";
				}
				urlObjWAF += PartId;
				//urlObjWAF += "?$mask=dsmveng:EngItemMask.Details";
				var dataRespTC;
				let dataResp=WAFData.authenticatedRequest(urlObjWAF, {
					method: methodWAF,
					headers: headerWAF,
					data: {},
					type: "json",
					async : false,
					onComplete: function(dataResp) {
						dataRespTC=dataResp;
						console.log("getPartDetailsreturn--sss----- >> ",dataRespTC);
								
					},
					onFailure: function(error, backendresponse, response_hdrs) {
						alert(backendresponse.message);
						console.log(backendresponse);
						console.log(response_hdrs);
						widget.body.innerHTML += "<p>Something Went Wrong"+error+"</p>";
					}
				})
				return dataRespTC;
			},
			partDropped: function(sPartId,partName,partTitle,partCollabSpace) { 
				console.log("PartId dropped:", sPartId);
				comWidget.CreateScreen(sPartId,partName,partTitle,partCollabSpace);
			},
			CreateScreen: function(sPartId,partName,partTitle,partCollabSpace) { 
				var container = widget.createElement('div', { 'id' : 'container' });
				var parttable = widget.createElement('table', { 'id' : 'parttable' });
				var mainDiv = widget.createElement('div', { 'id' : 'mainDiv' });
				
				
				var ssubDiv = widget.createElement('div', { 'id' : 'ssubDiv'});
				ssubDiv.style = "display: flex; justify-content: flex-start";

				var AddPlantsbutton = document.createElement('button', {'class':'dynamic-button'});
				AddPlantsbutton.style = "border-radius: 4px; padding: 1px 10px; font-size: 12px; margin: 10px; background-color: #f1f1f1; color: black; border: none; cursor: pointer";
				AddPlantsbutton.innerHTML = "Add Plants";
				AddPlantsbutton.addEventListener('click', () => comWidget.AddPlantPopup());
				ssubDiv.appendChild(AddPlantsbutton);

				var clearbutton = document.createElement('button', {'class':'dynamic-button'});
				clearbutton.style = "border-radius: 4px; padding: 5px 20px; font-size: 12px; text-align: center; margin: 10px; background-color: #368ec4; color: white; border: none; cursor: pointer";
				clearbutton.innerHTML = 'clear';
				clearbutton.addEventListener('click', comWidget.onLoad);
				ssubDiv.appendChild(clearbutton);

				var savebutton = document.createElement('button', {'class':'dynamic-button'});
				savebutton.style = "border-radius: 4px; padding: 5px 20px; font-size: 12px; text-align: center; margin: 10px; background-color: #368ec4; color: white; border: none; cursor: pointer";
				savebutton.innerHTML = 'save';
				savebutton.addEventListener('click', () => comWidget.SaveData());
				ssubDiv.appendChild(savebutton);

				var exportbutton = document.createElement('button', {'class':'dynamic-button'});
				exportbutton.style = "border-radius: 4px; padding: 1px 10px; font-size: 12px; margin: 10px; background-color: #f1f1f1; color: black; border: none; cursor: pointer";
				exportbutton.innerHTML = '<img src= "https://krishnaprasadarisetty.github.io/SLK_Boss_ATT/BO_ATT/Images/exportImage.JPG" alt="Export Icon" /> Export';
				var img = exportbutton.querySelector('img');
				img.style = "height : 20px ";
				exportbutton.addEventListener('click', () => comWidget.exportTable('Part_Spec_BossAtt.csv'));
				ssubDiv.appendChild(exportbutton);

				var MassUpdatebutton = document.createElement('button', {'class':'dynamic-button'});
				MassUpdatebutton.style = "border-radius: 4px; padding: 1px 10px; font-size: 12px; margin: 10px; background-color: #f1f1f1; color: black; border: none; cursor: pointer";
				MassUpdatebutton.innerHTML = "Mass Update";
				ssubDiv.appendChild(MassUpdatebutton);

				//Call part and class table creation functions
				
				comWidget.partTable(sPartId,partName,partTitle,parttable);  // Populate the part table with data

				mainDiv.appendChild(parttable);
				mainDiv.appendChild(ssubDiv);


				comWidget.classTable(sPartId,partCollabSpace,mainDiv);  // Populate the spec table with data


				container.appendChild(mainDiv);
				
				//whereUsedTable.tableData.addRow({ 
				//	id:3, Plant:"KKKK", Seq:"1",Status:"Current",MFG_Change: "MCONAME", MFG_Status: "Create",Change:"CA-000004", Change_Status:"In Work", Oracle_Template:"template-003", ERPStatus:"true",ERP_Export:"Yes", Lead_Plant:"False", Make_Buy:"make", SortValue:"1"
				//});

				widget.body.innerHTML="";
				widget.body.appendChild(container);
				
				// call get Prod childs
				if ("VPMReference" == ProductType  ) {
					productChilds = comWidget.getChildParts();
					console.log("productChilds----"+productChilds);
				}
			},
			getChildParts: function() {
				
				let urlObjWAF = urlBASE+"resources/v1/modeler/dseng/dseng:EngItem/";
				urlObjWAF += sMainPartId;
				urlObjWAF += "/expand";
				let body  = {"expandDepth": 1,"type_filter_bo": ["VPMReference"],"type_filter_rel": ["VPMInstance"]};
				let childDetails = comWidget.callwebService("POST",urlObjWAF,JSON.stringify(body));
				let childs = childDetails.output.member
					.filter(member => (member.type === "VPMReference" || member.type === "Raw_Material" ) && member.id !== sMainPartId )
					//.map(member => member.id);
					.map(member => ({ id: member.id, type: member.type }));
				return childs;
			},
			getLibClassDetails: function(sLibId) {
				AllclassesObject = [];
				//Call web service--
				let urlObjWAF = urlBASE+"resources/v1/modeler/dslib/dslib:Library/";
				urlObjWAF += sLibId;
				urlObjWAF += "?$mask=dslib:ExpandClassifiableClassesMask";
				let LibClassDetails =comWidget.callwebService("GET",urlObjWAF,"");
				if(LibClassDetails.status) {
					const lib_Classes = LibClassDetails.output
					if (lib_Classes.member) {
						lib_Classes.member.forEach(library => {
							console.log("Library:", library.name);  // Log the library name
							// Check if the library has ChildClasses
							if (library.ChildClasses && library.ChildClasses.member) {
							library.ChildClasses.member.forEach(childClass => {
								console.log("Child Class:", childClass.title);  // Log the child class name
								// Check for any further nested ChildClasses in each childClass
								if (childClass.ChildClasses && childClass.ChildClasses.member) {
								childClass.ChildClasses.member.forEach(subChildClass => {
									AllclassesObject.push({"id":subChildClass.id,"title":subChildClass.title});
								});
								}
							});
							}
						});
					}
				}
				console.log("AllclassesObject:", AllclassesObject); 
				return AllclassesObject;
			},
			getClassAttributes: function(sClassId) {
				let urlObjWAF = urlBASE+"resources/v1/modeler/dslib/dslib:Class/";
				urlObjWAF += sClassId;
				urlObjWAF += "?$mask=dslib:ClassAttributesMask";
				return LibClassDetails =comWidget.callwebService("GET",urlObjWAF,"");
			},
			searchCA :function(flowDownCaName){
				let caID = "";
				let urlObjWAF = urlBASE+"resources/v1/modeler/dslc/changeaction/search?$searchStr=name:";
				urlObjWAF += flowDownCaName;
				let caResponse =comWidget.callwebService("GET",urlObjWAF,"");
				if(caResponse.status && caResponse.output.changeAction[0]){
					caID = caResponse.output.changeAction[0].identifier;
				}
				return caID;
			},
			getCAdetails: function(sCAId) {
				let urlObjWAF = urlBASE+"resources/v1/modeler/dslc/changeaction/";
				urlObjWAF += sCAId;
				urlObjWAF += "?$fields=proposedChanges,flowDown";
				console.log("urlObjWAF----"+urlObjWAF);
				return comWidget.callwebService("GET",urlObjWAF,"");
			},
			getCAData: function(flowDownCaId) {
				let CADetails = {"CAAtt":[]};
				let response = comWidget.getCAdetails(flowDownCaId);
				if (response.status) {
					response.output.isFlowDownOf.forEach(item =>{
						let CAData = {};
						if (item.type === "Change Action") {
							console.log(item.identifier);
							let result = comWidget.getCAdetails(item.identifier);
							if (result.status) {
								CAData["state"] = result.output.state;
								CAData["title"] = result.output.title;	
							}						  							
						}
						CADetails.CAAtt.push(CAData);
					});
					CADetails["MCOState"] = response.output.state;
					CADetails["MCOTitle"] = response.output.title;
					
				}
				return CADetails;	
			},
			getAssignedClassDetails: function(sPartId) {
				let AssignedClasses = { "classes": [] };
				let urlObjWAF = urlBASE+"resources/v1/modeler/dslib/dslib:ClassifiedItem/";
				urlObjWAF += sPartId;
				urlObjWAF += "?$mask=dslib:ClassificationAttributesMask";
				let  response =comWidget.callwebService("GET",urlObjWAF,"");
				if(response.status && response.output.member[0].ClassificationAttributes.member) {
					let ClassExtensions = response.output.member[0].ClassificationAttributes.member;
					cestamp = response.output.member[0].cestamp;
					console.log("ClassExtensions----"+ClassExtensions);
					ClassExtensions.forEach(classItem => {
						ALLClasses.classes.forEach(allClass => {
							if (classItem.ClassID === allClass.id) {
								let classObject = {"id":allClass.id,"title":allClass.title};
								classItem.Attributes.forEach(attItem => {
									if(attItem.name.slice(3)==="FlowDownCA" && attItem.value) {
										const flowDownCaName = attItem.value;
										const flowDownCaId = comWidget.searchCA(flowDownCaName);
										if(flowDownCaId){
											// call getCA details
											let CADetails = comWidget.getCAData(flowDownCaId);
											classObject["MCOStatus"] = CADetails.MCOState;
											classObject["MCOTitle"] = CADetails.MCOTitle;
											let CANames = "", CAStatus = "";
											CADetails.CAAtt.forEach(item => {
												CANames += ","+item.title;
												CAStatus += ","+item.state;
											});
											classObject["CANames"] = CANames.slice(1);
											classObject["CAState"] = CAStatus.slice(1);
										}								
										
									} else {
										classObject[attItem.name.slice(3)] = attItem.value;
									}
									
								});
								AssignedClasses.classes.push(classObject);
							}
						});
						
					});

				}
				return AssignedClasses;
			},
			getUserGroup : function(sPartId){
				let userGroup = [];
				let urlObjWAF = urlBASE+"resources/pno/ownership";
				const body  = { "businessObject": [{"objectID":sPartId}]};
				let groupDetails =comWidget.callwebService("POST",urlObjWAF,JSON.stringify(body));
				if(groupDetails.status){
					groupDetails.output.ownershipVector[0].ownership.forEach(itm => {
						let access = itm.access.logical;
						let groupName = itm.owner.group.groupTitle;
						if ( access == "Author") {
							comWidget.getLibraryclassDetails(groupName);
						}						
						userGroup.push({"GroupName" : groupName, "Access":access});
					});
				}
				console.log("userGroup=====>"+JSON.stringify(userGroup));
				return userGroup;
			},
			getLibraryclassDetails :function(searchString){
				let urlObjWAF = urlBASE+"resources/v1/modeler/dslib/dslib:Library/search?$searchStr="+searchString;
				let LibDetails =comWidget.callwebService("GET",urlObjWAF,"");
				if(LibDetails.status) {
					LibDetails.output.member.forEach(item => {
						if (item.title === searchString ){
							ALLClasses.classes.push(...comWidget.getLibClassDetails(item.id));	
						}
					});					
					console.log("ALLClasses---classess--insideliab:", ALLClasses.classes); 
				}

			},
			classTable: function(sPartId,partCollabSpace,mainDiv) {
				console.log("Creating class table for PartId:", sPartId);
				let ClassTableData = [];
				ALLClasses = { "classes": [] };
				 InitialAssignedClasses = "";
				let uniqueInAllclasses = { "classes": [] };
				//getLibraryclassDetails
				//Need to update proper Collbspace anme in future
				//Here searchstr is Library description need to update and fix furthur
				comWidget.getLibraryclassDetails(partCollabSpace);
				/*
				let urlObjWAF = urlBASE+"resources/v1/modeler/dslib/dslib:Library/search?$searchStr=Library_MM";
				let LibDetails =comWidget.callwebService("GET",urlObjWAF,"");
				if(LibDetails.status) {
					const lib_Details = LibDetails.output;
					const sLibId = lib_Details.member[0].id;
					ALLClasses.classes.push(...comWidget.getLibClassDetails(sLibId));					
					console.log("ALLClasses---classess--:", ALLClasses.classes); 
				}
				*/

				//get user Group and there classes alsointo All classes				
				let userGroup = comWidget.getUserGroup(sPartId);
				console.log("UserGroup==----->", +userGroup);

				InitialAssignedClasses = comWidget.getAssignedClassDetails(sPartId);
				console.log("InitialAssignedClasses--:", InitialAssignedClasses); 

				uniqueInAllclasses.classes = ALLClasses.classes.filter(allClass => 
					!InitialAssignedClasses.classes.some(assigned => assigned.id === allClass.id)
				  );
				console.log("uniqueInAllclasses--:", uniqueInAllclasses);

				mainDiv.appendChild(whereUsedTable.showTable(uniqueInAllclasses.classes.map((plantObject, index) => {
					return { id: index + 1, Plant: plantObject.title}}),comWidget.getAvaliablePlantTable(),"AvaliablePlantTable"));
				
					InitialAssignedClasses.classes.forEach((Plantclass,index) => {
						const plantName = Plantclass.title.slice(6);
						console.log("plantName-------->"+plantName);
						ClassTableData.push({id:index+1, Plant:Plantclass.title, Seq:"1",Status:"Current",MFG_Change:Plantclass.MCOTitle, MFG_Status: Plantclass.MCOStatus, Change: Plantclass.CANames, Change_Status: Plantclass.CAState, Oracle_Template:Plantclass.oracletemplate, ERP_Status:"Active",ERP_Export:Plantclass.ERPExport, Lead_Plant:Plantclass.LeadPlant, MBom:Plantclass.mbom ? "Make" : "Buy", Sort_Value:""});
					});
				console.log("ClassTableData-------->"+JSON.stringify(ClassTableData));
				
				mainDiv.appendChild(whereUsedTable.showTable(ClassTableData,comWidget.getAssignedPlantTable(),"AssigendPlantTable"));
			},
	
			partTable: function(sPartId,partName,partTitle,parttable) { 
	
				const headers = ['Part Names', 'Title'];

				// Create the first row
				const row1 = document.createElement("tr");
				headers.forEach(text => {
					const headerCol = document.createElement("th");
					headerCol.innerText = text;
					row1.appendChild(headerCol);
				});
				parttable.appendChild(row1);  // Add the first row to the table
				
				// Create the second row
				const head2 = [partName, partTitle];
				const row2 = document.createElement("tr");
				head2.forEach(text => {
					const headerCol = document.createElement("th");
					headerCol.innerText = text;
					row2.appendChild(headerCol);
				});
				parttable.appendChild(row2);  // Add the second row to the table
	
			},
			AddProductCard : function (){

			},
			getAssignedPlantTable : function (){
				const columns =  [
                    { title: "Plant", field: "Plant" },
                    { title: "Seq", field: "Seq" },
                    { title: "Status", field: "Status" },
                    { title: "MFG Change", field: "MFG_Change" },
                    { title: "MFG Status", field: "MFG_Status" },
                    { title: "Change", field: "Change" },
                    { title: "Change Status", field: "Change_Status" },
                    { title: "Oracle Template", field: "Oracle_Template"},
                    { title: "ERP Status", field: "ERP_Status" },
                    { title: "ERP Export", field: "ERP_Export", editor:"list", editorParams:{values:{"Yes":"Yes", "No":"No"}}},
                    { title: "Lead Plant", field: "Lead_Plant", editor:"list", editorParams:{values:{"true":"true", "false":"false"}}},
                    { title: "MBom", field: "MBom", editor:"list", editorParams:{values:{"Make":"Make", "Buy":"Buy"}}},
                    { title: "Sort Value", field: "Sort_Value" }
                ];
				return columns;
			},
			getAvaliablePlantTable : function (){
				const columns =  [
                    { title: "Avaliable Plant", field: "Plant" }
                ];
				return columns;
			},
			SaveData : function (){
				if(hasInWorkCA) {
					let tableData = { "classes" : [] }
					let assignedTable = whereUsedTable.AssigendPlantTableData;
					assignedTable.getRows().forEach(row => {
						tableData.classes.push(row.getData());
					});
					console.log("tableData --->"+JSON.stringify(tableData));
					if(tableData.classes.length > 0 ){
						comWidget.updateClassAttribuets(tableData);
					}
				} else if(partState==="RELEASED"){
					alert("Change Action is required to update, please assign Modify change Action and try again"); 
				} else {
					alert("Change Action is required to update, please assign change Action and try again"); 
				}
			},
			updateClassAttribuets : function(tableData) {
				let updateditem = {};
				
				console.log("InitialAssignedClasses-----before---->"+JSON.stringify(InitialAssignedClasses));
				InitialAssignedClasses.classes.forEach(intclass => {
					tableData.classes.forEach(tableitem => {
						let plantName  = tableitem.Plant.slice(6);
						if (intclass.title == tableitem.Plant) {
							//old row updated	
							if(intclass.ERPExport !== tableitem.ERP_Export){
								updateditem[plantName+"ERPExport"] = tableitem.ERP_Export;
								intclass["ERPExport"] = tableitem.ERP_Export;
							}
							if(String(intclass.LeadPlant) !== String(tableitem.Lead_Plant)){
								updateditem[plantName+"LeadPlant"] = tableitem.Lead_Plant;
								intclass["LeadPlant"] = tableitem.Lead_Plant;
							}
							const MBOMValue = intclass.mbom ? "Make" : "Buy";
							if( MBOMValue !== tableitem.MBom){
								updateditem[plantName+"mbom"] = tableitem.MBom === "Make" ? true : false;
								intclass["mbom"] = tableitem.MBom === "Make" ? true : false;
							}
						}						
					});
				});

				//find out additional rows-->
				const resultList = tableData.classes.map(tableitem => {
					const matchedClass = InitialAssignedClasses.classes.find(initialClass => initialClass.title === tableitem.Plant);
					if (!matchedClass) {
						let plantName  = tableitem.Plant.slice(6);
						const classid = ALLClasses.classes.find(classitem => classitem.title === tableitem.Plant)?.id;
						console.log("classid----"+classid);
						let classObject = {"id":classid,"title":tableitem.Plant};
						// call classify product to class..nnnnn
						const result = comWidget.classifyProduct(classid,sMainPartId);

						if(result.status){							
								//call is success prepare attributes update							
							if(tableitem.ERP_Export){
								updateditem[plantName+"ERPExport"] = tableitem.ERP_Export;
								classObject["ERPExport"] = tableitem.ERP_Export;
							}
							if(String(tableitem.Lead_Plant)){
								updateditem[plantName+"LeadPlant"] = tableitem.Lead_Plant;
								classObject["LeadPlant"] = tableitem.Lead_Plant;
							}
							if(tableitem.MBom){
								updateditem[plantName+"mbom"] = tableitem.MBom === "Make" ? true : false;
								classObject["mbom"] = tableitem.MBom === "Make" ? true : false;
							}	
						}
						InitialAssignedClasses.classes.push(classObject);									
					}
				});
				console.log("updateditem--final----"+JSON.stringify(updateditem));
				if (JSON.stringify(updateditem) !== "{}") {					
					//Update cestep
					comWidget.getProductcestamp();
					updateditem["cestamp"] = cestamp;
					let urlObjWAF = urlBASE+"resources/v1/modeler/dslib/dslib:ClassifiedItem/";
					urlObjWAF += sMainPartId;
					let  response =comWidget.callwebService("PATCH",urlObjWAF,JSON.stringify(updateditem));
					if(response.status){
						console.log("Update----Success------");
						// do child propagation
						let propdetails = [];
						Object.entries(updateditem).forEach(([key, value]) => {
							if (key.toLowerCase().includes("mbom") && value === true) {
								const plantName = key.replace("mbom", "");
								console.log("plantName------"+plantName);
								const matchingEntry = ALLClasses.classes.find(item => item.title === "Plant "+plantName);
								propdetails.push(matchingEntry.id);
							}
						});
						if (propdetails && "VPMReference" == ProductType ){
							//call propogate Method
							comWidget.propagateChilds(propdetails);
						}
					}
				}
				//InitialAssignedClasses = comWidget.getAssignedClassDetails(sMainPartId);
				console.log("InitialAssignedClasses--final----"+JSON.stringify(InitialAssignedClasses.classes));
				alert("Data Saved Successfully");
			},
			propagateChilds : function(propdetails) {
				let classifyBody = {}; 
				propdetails.forEach(classitems =>{
					let classifyBody = {"ClassID": classitems, "ObjectsToClassify": []};
					//let prodbodyTemplate ={"source": urlBASE.slice(0, -1),"type": "VPMReference"};
					productChilds.forEach(prod =>{
						let prodbody = {"source": urlBASE.slice(0, -1)};
						prodbody["identifier"] = prod.id;
						prodbody["type"] = prod.type;
						if (prod.type == "VPMReference") {
							prodbody["relativePath"] = "/resources/v1/modeler/dseng/dseng:EngItem/"+prod.id;						
						} else {
							prodbody["relativePath"] = "/resources/v1/modeler/dsrm/dsrm:RawMaterial/"+prod.id;	
						}
						classifyBody.ObjectsToClassify.push(prodbody);
					});
					console.log("classifyBody----"+JSON.stringify(classifyBody));
					//call prod classfiywebservice
					if(classifyBody.ObjectsToClassify.length > 0 ){
						let urlObjWAF = urlBASE+"resources/v1/modeler/dslib/dslib:ClassifiedItem";				
						let response =  comWidget.callwebService("POST",urlObjWAF,JSON.stringify(classifyBody));
					}
				});

			},
			getProductcestamp : function() { 
				let urlObjWAF = urlBASE+"resources/v1/modeler/dslib/dslib:ClassifiedItem/";
				urlObjWAF += sMainPartId;
				let  response =comWidget.callwebService("GET",urlObjWAF,"");
				if(response.status && response.output.member[0]) {
					cestamp = response.output.member[0].cestamp;
				}
			}
		};
		widget.addEvent('onLoad', comWidget.onLoad);
		widget.addEvent('onRefresh', comWidget.onLoad);
	});