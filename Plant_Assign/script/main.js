require(["DS/DataDragAndDrop/DataDragAndDrop", "DS/PlatformAPI/PlatformAPI", "DS/WAFData/WAFData", "DS/i3DXCompassServices/i3DXCompassServices","Plant/script/table"], 
	function(DataDragAndDrop, PlatformAPI, WAFData, BaseUrl,whereUsedTable) {
		
		var urlBASE,csrfToken,securityContext;
		
		securityContext= "ctx%3A%3AVPLMProjectLeader.BU-0000001.Rosemount%20Flow",
		urlBASE = "";

		var comWidget = {

			onLoad: function() { 
								
				// Create a dropbox for drag-and-drop functionality
				var dropbox = widget.createElement('div', { 'class' : 'mydropclass', 'text' : ''});
				var dropimage = widget.createElement('img', { 'src': 'https://krishnaprasadarisetty.github.io/SLK_Boss_ATT/BO_ATT/Images/dropImage.png', 'alt': 'Dropbox Image' });
				dropbox.append(dropimage);
				var dropboxsep = widget.createElement('div', { 'class' : 'dropboxsep', 'text' : '-- or --' });
				dropboxsep.style= "font-size: 12px; color: #d5e8f2; text-align: center";
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
						console.log("partName---->", partName);
						console.log("partTitle---->", partTitle);
						comWidget.partDropped(PartId,partName,partTitle);
						
						

						
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
					Accept: "application/json"
				};
				let kp;
				let dataResp=WAFData.authenticatedRequest(urlObjWAF, {
					method: methodWAF,
					headers: headerWAF,
					data: data,
					type: "json",
					async : false,
					onComplete: function(dataResp) {
						kp=dataResp;
						console.log("kp--CallWebService--- >> ",kp);
					},
					onFailure: function(error, backendresponse, response_hdrs) {
						console.log(backendresponse);
						console.log(response_hdrs);
						widget.body.innerHTML += "<p>Something Went Wrong"+error+"</p>";
					}
				})
				
				return kp;
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
			partDropped: function(sPartId,partName,partTitle) { 
				console.log("PartId dropped:", sPartId);
				comWidget.CreateScreen(sPartId,partName,partTitle);
			},
			CreateScreen: function(sPartId,partName,partTitle) { 
				var container = widget.createElement('div', { 'id' : 'container' });
				var classtable = widget.createElement('table', { 'id' : 'classtable' });
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
				comWidget.classTable(sPartId,classtable);  // Populate the spec table with data

				

				// Append table sections
				mainDiv.appendChild(parttable);
				mainDiv.appendChild(ssubDiv);

				mainDiv.appendChild(classtable);

				container.appendChild(mainDiv);
				var tabledata = [
					{id:1, Plant:"MVO", Change:"CA-000004", ChangeStatus:"In Work", OracleTemplate:"template-003", Make_Buy:"make", ERPStatus:"true", SortValue:"1"},
					{id:1, Plant:"MMB", Change:"CA-000004", ChangeStatus:"In Work", OracleTemplate:"template-004", Make_Buy:"buy", ERPStatus:"false", SortValue:"3"},
				];
				container.appendChild(whereUsedTable.showTable(tabledata));

				widget.body.innerHTML="";
				widget.body.appendChild(container);
			},
	
			classTable: function(sPartId,classtable) {
				console.log("Creating spec table for PartId:", sPartId);
				
					// Create and append the checkbox column
					const checkboxHeader = document.createElement("th");
					const checkbox = document.createElement("input");
					checkbox.type = "checkbox";
					checkboxHeader.appendChild(checkbox);
					classtable.appendChild(checkboxHeader);
				   //-----------
					const headers = ['Plant','Change','Change Status','Oracle Template', 'Make/Buy','ERP Status','Sort Value'];
					headers.forEach(text => {
						const headerCol = document.createElement("th");
						headerCol.innerText = text;
						classtable.appendChild(headerCol);
					});

				/*
				let urlObjWAF = urlBASE+"resources/v1/modeler/documents/parentId/";
				urlObjWAF += sPartId;
				urlObjWAF += "?parentRelName=SpecificationDocument";
				let SpecDetails =comWidget.callwebService("GET",urlObjWAF,"")
				for (let i = 0; i < SpecDetails.items; i++) { 
					let sSpec = SpecDetails.data[i];
					let sSpecID = sSpec.id;
					let sSpecTitle =  sSpec.dataelements.title;
					let sSpecRevision =  sSpec.dataelements.revision;
					//let sSpecDesc =  document.dataelements.description;
					//let sSpecState =  document.dataelements.state;
					const row = document.createElement("tr");
					const checkboxHeader2 = document.createElement("th");
					const checkbox2 = document.createElement("input");
					checkbox2.type = "checkbox";
					checkboxHeader2.appendChild(checkbox2);
					row.appendChild(checkboxHeader2);

					const cell1 = document.createElement("td");
					cell1.innerText = sSpecTitle;
					row.appendChild(cell1);
					const cell2 = document.createElement("td");
					//========
					cell2.innerText = sSpecRevision;
					row.appendChild(cell2);
					[ 'Att1 Value', 'Att2 Value', 'Att3 Value','Att4 Value'].forEach(value => {
						
						const cell = widget.createElement("td");
						const select = widget.createElement("select");
						select.innerHTML = '<option>Y</option><option>N</option>';
						cell.appendChild(select)
						row.appendChild(cell);
					});
					classtable.appendChild(row);
				}
				*/

				
	
				// Here, populate the tbody with rows based on the partId
				// You can add dynamic data for rows as needed
				const row = document.createElement("tr");
				// Create and append the checkbox column
				const checkboxHeader2 = document.createElement("th");
				const checkbox2 = document.createElement("input");
				checkbox2.type = "checkbox";
				checkboxHeader2.appendChild(checkbox2);
				row.appendChild(checkboxHeader2);
				//---------

				const cell1 = document.createElement("td");
				cell1.innerText = "MVO";
				row.appendChild(cell1);
				[ 'CA-000004', 'In Work', 'template-003','make','true','2'].forEach(value => {
					
					const cell = widget.createElement("td");
					const select = widget.createElement("select");
					//select.innerHTML = '<option>Y</option><option>N</option>';
					cell.innerHTML = value;
					//cell.appendChild(select)
					row.appendChild(cell);
				});
				classtable.appendChild(row);

				//---------------
				const row2 = document.createElement("tr");
				// Create and append the checkbox column
				const checkboxHeader3 = document.createElement("th");
				const checkbox3 = document.createElement("input");
				checkbox3.type = "checkbox";
				checkboxHeader3.appendChild(checkbox3);
				row2.appendChild(checkboxHeader3);
				//------
				const cell2 = document.createElement("td");
				cell2.innerText = "MMB";
				row2.appendChild(cell2);
		
				[  'CA-000004', 'In Work', 'template-007','Buy','false','4'].forEach(value => {
					
					const cell = widget.createElement("td");
					const select = widget.createElement("select");
					//select.innerHTML = '<option>Y</option><option>N</option>';
					cell.innerHTML = value;
					//cell.appendChild(select)
					row2.appendChild(cell);
				});
				classtable.appendChild(row2);
				
				//-------------
			},
	
			partTable: function(sPartId,partName,partTitle,parttable) { 
	
					const headers = ['Part Names', 'Title'];
					headers.forEach(text => {
						const headerCol = document.createElement("th");
						headerCol.innerText = text;
						parttable.appendChild(headerCol);
					});
				
					const head2 = [partName,partTitle];
					head2.forEach(text => {
						const headerCol = document.createElement("th");
						headerCol.innerText = text;
						parttable.appendChild(headerCol);
					});
				
	
			},
			AddProductCard : function (){
			},
			connectBase : function (){
				 
			},
		};
		widget.addEvent('onLoad', comWidget.onLoad);
		widget.addEvent('onRefresh', comWidget.onLoad);
	});