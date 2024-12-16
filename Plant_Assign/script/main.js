require(["DS/DataDragAndDrop/DataDragAndDrop", "DS/PlatformAPI/PlatformAPI", "DS/WAFData/WAFData", "DS/i3DXCompassServices/i3DXCompassServices","Plant/script/table"], 
	function(DataDragAndDrop, PlatformAPI, WAFData, BaseUrl,whereUsedTable) {
		
		var urlBASE,csrfToken,securityContext;
		var sMainPartId,InitialAssignedClasses,cestamp;
		
		securityContext= "ctx%3A%3AVPLMProjectLeader.BU-0000001.Micro%20Motion",
		urlBASE = "";


		//------

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
						const ProductType = objList[0].objectType;
						if ("VPMReference"!=ProductType) {
							alert("Please drop only Products");
							return;
						}
						console.log("PartId dropped:", PartId);	
						var dataResp3 = comWidget.getPartDetails(PartId);
						console.log("dataResp3---->", dataResp3);
						
						let partName = dataResp3.member[0].name;
						let partTitle = dataResp3.member[0].title;
						let partCollabSpace  = dataResp3.member[0].collabspace;
						console.log("partName---->", partName);
						console.log("partTitle---->", partTitle);
						comWidget.partDropped(PartId,partName,partTitle,partCollabSpace);
						
						

						
					},
				});
			},
			AddPlantPopup : function(mainDiv){
				const popup = widget.createElement('div');
				popup.id = 'popup';
				popup.classList.add('popup');

				const popupContent = widget.createElement('div');
				popupContent.classList.add('popup-content');
				popup.style =  "display: none; position: fixed; top: 20px; right: -250px; width: 250px; height: 200px; background-color: white;border: 1px solid #ccc;box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);transition: right 0.3s ease ";
				const closePopupBtn = widget.createElement('span');
				closePopupBtn.id = 'closePopupBtn';
				closePopupBtn.classList.add('close');
				closePopupBtn.innerHTML = '&times;';

				const popupTitle = widget.createElement('h3');
				popupTitle.innerText = 'Avaliable Plants';

				const popupParagraph = widget.createElement('p');
				popupParagraph.innerText = 'This is a small popup that appears on the right of the screen.';

				popupContent.appendChild(closePopupBtn);
				popupContent.appendChild(popupTitle);
				popupContent.appendChild(popupParagraph);
				popup.appendChild(popupContent);
				container.appendChild(popup);

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
				urlObjWAF += PartId;
				urlObjWAF += "?$mask=dsmveng:EngItemMask.Details";
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
				AddPlantsbutton.addEventListener('click', () => comWidget.AddPlantPopup(mainDiv));
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
				


				widget.body.innerHTML="";
				widget.body.appendChild(container);
			},
			getLibClassDetails: function(sLibId) {
				let ALLClasses = { "classes": [] };
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
									ALLClasses.classes.push({"id":subChildClass.id,"title":subChildClass.title});
								});
								}
							});
							}
						});
					}
				}
				console.log("ALLClasses:", ALLClasses); 
				return ALLClasses;
			},
			getClassAttributes: function(sClassId) {
				let urlObjWAF = urlBASE+"resources/v1/modeler/dslib/dslib:Class/";
				urlObjWAF += sClassId;
				urlObjWAF += "?$mask=dslib:ClassAttributesMask";
				return LibClassDetails =comWidget.callwebService("GET",urlObjWAF,"");
			},
			getAssignedClassDetails: function(sPartId,ALLClasses) {
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
									classObject[attItem.name.slice(3)] = attItem.value;
								});
								AssignedClasses.classes.push(classObject);
							}
						});
						
					});

				}
				return AssignedClasses;
			},
			classTable: function(sPartId,partCollabSpace,mainDiv) {
				console.log("Creating class table for PartId:", sPartId);
				let ClassTableData = [];
				let ALLClasses = "";
				 InitialAssignedClasses = "";
				let uniqueInAllclasses = { "classes": [] };
				//Need to update proper Collbspace anme in future
				//Here searchstr is Library description need to update and fix furthur
				let urlObjWAF = urlBASE+"resources/v1/modeler/dslib/dslib:Library/search?$searchStr=Library_MM";
				let LibDetails =comWidget.callwebService("GET",urlObjWAF,"");
				if(LibDetails.status) {
					const lib_Details = LibDetails.output;
					const sLibId = lib_Details.member[0].id;
					ALLClasses = comWidget.getLibClassDetails(sLibId);
					console.log("ALLClasses---classess--:", ALLClasses.classes); 
				}
				InitialAssignedClasses = comWidget.getAssignedClassDetails(sPartId,ALLClasses);
				console.log("InitialAssignedClasses--:", InitialAssignedClasses); 

				uniqueInAllclasses.classes = ALLClasses.classes.filter(allClass => 
					!InitialAssignedClasses.classes.some(assigned => assigned.id === allClass.id)
				  );
				console.log("uniqueInAllclasses--:", uniqueInAllclasses);

				mainDiv.appendChild(whereUsedTable.showTable(uniqueInAllclasses.classes.map((plantObject, index) => {
					return { id: index + 1, Plant: plantObject.title}}),comWidget.getAvaliablePlantTable(),"AvaliablePlantsTable"));
				
					InitialAssignedClasses.classes.forEach((Plantclass,index) => {
					const plantName = Plantclass.title.slice(6);
					console.log("plantName-------->"+plantName);
					ClassTableData.push({id:index+1, Plant:Plantclass.title, Seq:"1",Status:"Current",MFG_Change: "MCONAME", MFG_Status: "Create",Change:"CA-00000777", Change_Status:"In Work", Oracle_Template:Plantclass.oracletemplate, ERP_Status:Plantclass.ERPStatus,ERP_Export:Plantclass.ERPExport, Lead_Plant:Plantclass.LeadPlant, MBom:Plantclass.mbom ? "Make" : "Buy", SortValue:"1"});
				});
				console.log("ClassTableData-------->"+JSON.stringify(ClassTableData));
				//aaaaa
				//ClassTableData = [
				//	{id:1, Plant:"MVO", Seq:"1",Status:"Current",MFG_Change: "MCONAME", MFG_Status: "Create",Change:"CA-000004", Change_Status:"In Work", Oracle_Template:"template-003", ERPStatus:"true",ERP_Export:"Yes", Lead_Plant:"False", Make_Buy:"make", SortValue:"1"},
				//	{id:1, Plant:"MMB", Seq:"1",Status:"Current",MFG_Change: "MCONAME", MFG_Status: "Create",Change:"CA-000004", ChangeStatus:"In Work", OracleTemplate:"template-004", ERPStatus:"true",ERP_Export:"Yes", Lead_Plant:"False", Make_Buy:"buy", SortValue:"2"},
				//];
				mainDiv.appendChild(whereUsedTable.showTable(ClassTableData,comWidget.getAssignedPlantTable(),"AssignedPlantsTable"));
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
                    { title: "Oracle Template", field: "Oracle_Template", editor:"input" },
                    { title: "ERP Status", field: "ERP_Status", editor:"list", editorParams:{values:{"true":"true", "true":"true"}}},
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
				let tableData = { "classes" : [] }
				let assignedplants = widget.body.querySelector('#AssignedPlantsTable');
				let theInput = assignedplants.querySelector('.tabulator-tableholder');  
				let rows = theInput.querySelectorAll('.tabulator-row');
				rows.forEach(row => {
				    let rowData = {};
				    let cells = row.querySelectorAll('.tabulator-cell');
				    cells.forEach(cell => {
				        let field = cell.getAttribute('tabulator-field'); 
				        let value = cell.innerText.trim();
						if (field !== null) {
					        rowData[field] = value;
						}
				    });
					tableData.classes.push(rowData);					
				});
				if(tableData.classes){
					comWidget.updateClassAttribuets(tableData);
				}
			},
			updateClassAttribuets : function(tableData) {
				let updateditem = {};
				console.log("final--->"+JSON.stringify(tableData));
				console.log("InitialAssignedClasses--------->"+JSON.stringify(InitialAssignedClasses));
				InitialAssignedClasses.classes.forEach(intclass => {
					tableData.classes.forEach(tableitem => {
						let plantName  = tableitem.Plant.slice(6);
						if (intclass.title == tableitem.Plant) {
							//old row updated
							if(intclass.oracletemplate !== tableitem.Oracle_Template){
								updateditem[plantName+"oracletemplate"] = tableitem.Oracle_Template;
							}
							if(intclass.ERPStatus !== tableitem.ERP_Status){
								updateditem[plantName+"ERPStatus"] = tableitem.ERP_Status;
							}
							if(intclass.ERPExport !== tableitem.ERP_Export){
								updateditem[plantName+"ERPExport"] = tableitem.ERP_Export;
							}
							if(String(intclass.LeadPlant) !== String(tableitem.Lead_Plant)){
								updateditem[plantName+"LeadPlant"] = tableitem.Lead_Plant;
							}
							const MBOMValue = intclass.mbom ? "Make" : "Buy";
							if( MBOMValue !== tableitem.MBom){
								updateditem[plantName+"mbom"] = tableitem.MBom === "Make" ? true : false;
							}
						
						} else {
							//new RowAdded
						}						
					});
				});
				console.log("updateditem------"+JSON.stringify(updateditem));
				if (JSON.stringify(updateditem) !== "{}") {
					//Update cestep
					comWidget.getProductcestamp();
					updateditem["cestamp"] = cestamp;
					let urlObjWAF = urlBASE+"resources/v1/modeler/dslib/dslib:ClassifiedItem/";
					urlObjWAF += sMainPartId;
					console.log("updateditem--11111----");
					let  response =comWidget.callwebService("PATCH",urlObjWAF,JSON.stringify(updateditem));
					console.log("updateditem--2222222----");
					if(response.status){
						console.log("updateditem------"+JSON.stringify(response.output));
					}else {
						console.log("updateditem--Error----");
					}
				}
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