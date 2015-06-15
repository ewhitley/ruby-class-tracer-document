
    var json_path = "content/class_info.json"
    var class_trace_debug = false

    if (class_trace_debug == true) {
        $("#debug_info_tab").removeClass("hide");
    }


    var d3json = {}

    $( document ).ready(function() {
        process_class_json();
    });

    function js_safe_name(name) {
        return name.replace(/[^A-Z0-9_]+/gi, "");
    }

    function strip_quotes(name) {
        return name.replace(/[\'\"]+/gi, "");
    }

    //http://www.java2s.com/Tutorial/JavaScript/0220__Array/Usinganalphabeticalsortmethodonstrings.htm
    function alphabetical(a, b)
    {
         var A = a.toLowerCase();
         var B = b.toLowerCase();
         if (A < B){
            return -1;
         }else if (A > B){
           return  1;
         }else{
           return 0;
         }
    }

    function process_class_json() {

        var url = window.location.href;
        var debug_data = []
        debug_data.push( "<dt>JSON Path</dt><dd>" + json_path + "</dd>" );
        debug_data.push( "<dt>Current URI</dt><dd>" + url + "</dd>" );
        debug_data.push( "<dt>User Agent</dt><dd>" + navigator.userAgent + "</dd>" );


        $.getJSON( json_path, function( data ) {

        })
          .fail(function() {
            bummer = "<h1>Oops! How embarassing!</h1> <p>It appears we ran into an issue...</p>"
            if (url.substring(0, 7) == "file://" && navigator.userAgent.indexOf("Chrome") > -1) {
              bummer += "<h3>Chrome Police Have Seized Your JSON!</h3><p>Hey - it appears you're using Chrome and attempting to load JSON from a local file. Chrome's security policies don't currently allow this.</p><p>Please either load from a web server or use a different browser. Sorry!</p>"
              $("#class_info div").html(bummer)
              return;
            }
          })
          .done(function( data ) {

          var class_docs_toc = [];
          var class_docs_body = [];
          var trace_info_body = [];


          d3json.name = data.json_class
          d3json.type = "typeroot"
          d3json.children = []

          var all_class_names = []
          var all_referenced_types = []

          $.each( data.classes, function( class_name, class_def ) {
             all_class_names.push(class_name)
             //all_referenced_types = all_referenced_types.concat(class_def.referenced_types)
             //the above is better, but I need to strip the quotes for now
              $.each( class_def.referenced_types, function( idx, var_type ) {
                all_referenced_types.push(strip_quotes(var_type))
              });
          });

          var unique_referenced_types = [];
          $.each(all_referenced_types, function(i, el){
                if($.inArray(el, unique_referenced_types) === -1) unique_referenced_types.push(el);
          });
          unique_referenced_types.sort(alphabetical)

          trace_info_body.push("<dt>Trace File Name</dt><dd>"+data.archive_path+"</dd>")   
          trace_info_body.push("<dt>Generated</dt><dd>"+data.date_generated+"</dd>")   
          trace_info_body.push("<dt>Number of Times Run</dt><dd>"+data.times_run+"</dd>")   
          trace_info_body.push("<dt>Last Updated</dt><dd>"+data.date_updated+"</dd>")   
          trace_info_body.push("<dt>Last Start Time</dt><dd>"+data.start_time+"</dd>")   
          trace_info_body.push("<dt>Last End Time</dt><dd>"+data.end_time+"</dd>")   
          trace_info_body.push("<dt>Last Trace Duration</dt><dd>"+data.trace_duration+"</dd>")   
          trace_info_body.push("<dt>Classes Profiled</dt><dd>"+all_class_names.length+"</dd>")
          trace_info_body.push("<dt>Referenced Type #</dt><dd>"+unique_referenced_types.length+"</dd>")
          uq_ref_types = []
          $.each( unique_referenced_types, function( idx, var_type ) {
              uq_ref_types.push("<dd>"+strip_quotes(var_type)+"</dd>")
          });
          trace_info_body.push("<dt>Referenced Types</dt>"+uq_ref_types.join(""))

          $.each( data.classes, function( class_name, class_def ) {

            d3child = {}
            d3child.name = class_name
            d3child.type = "typeclass"
            d3child.children = []
            $.each ( class_def.referenced_types, function( idx, var_type){
                if (var_type != class_name && all_class_names.indexOf(var_type) > -1) {
                    //don't show ones where we refere back to our own type
                    // also - filter to the types we sampled so we can just show those dependencies
                    var c = {}
                    c.name = strip_quotes(var_type)
                    c.type = "typeclass"
                    d3child.children.push(c)
                }
            });

            d3json.children.push(d3child)

            // if (class_name != "HQMF2::Coded" & class_name != "HQMF::Attribute" & class_name != "HQMF2::Precondition") {
            //     return true
            // }

  
            js_safe_class_name = js_safe_name(class_name)

            toc_items = [];
            doc_items = [];


            if (class_def.instance_vars && Object.keys(class_def.instance_vars).length > 0 ) {
                toc_link = js_safe_class_name + "-" + js_safe_name("instance_vars")
                toc_items.push("<li><a href=\"#"+toc_link+"\">Instance Variables</a></li>")   

                vars = []
                doc_items.push("<h3 id=\""+toc_link+"\">Instance Variables</h3>")
                $.each ( class_def.instance_vars, function( var_name, var_info){

                   req = !var_info.arg_type ? "" : var_info.arg_type
                   nilable = !var_info.nilable ? false : var_info.nilable
                   badge_info = "req"
                   if (req == "opt") {
                      badge_info = "opt"
                   } else if (req == "req") {
                      badge_info = "req"
                   } else if (nilable == true) {
                      badge_info = "opt"
                   }
                   tooltip_text = badge_info == "opt" ? "Nilable" : ""
                   badge = " <a data-toggle=\"tooltip\" data-placement=\"top\" title=\""+tooltip_text+"\"><span class=\"glyphicon glyphicon-record arg_type_"+badge_info+" \" aria-hidden=\"true\"></span></a>"
                   vars.push("<dt>"+strip_quotes(var_name)+badge+"</dt>")

                    $.each ( var_info.types, function( key, var_type){
                       vars.push("<dd class=\"data_type\">"+strip_quotes(var_type)+"</dd>")
                    });
                });
                doc_items.push("<dl class=\"dl-horizontal\">"+vars.join("")+"</dl><div class=\"clear\"/>")

            }
            $.each ( class_def.methods, function( method_name, method_def){

                js_safe_method_name = js_safe_name(method_name)

                toc_link = js_safe_class_name + "-" + js_safe_method_name
                toc_items.push("<li><a href=\"#"+toc_link+"\">"+method_name+"</a></li>")

                doc_items.push("<h3 id=\""+toc_link+"\">"+method_name+"</h3>")

                if (method_def.calling_vars && Object.keys(method_def.calling_vars).length > 0 ) {
                    vars = []
                    doc_items.push("<h4>Calling Parameters</h3>")
                    $.each ( method_def.calling_vars, function( var_name, var_info){
                       req = !var_info.arg_type ? "" : var_info.arg_type
                       nilable = !var_info.nilable ? false : var_info.nilable
                       badge_info = "req"
                       if (req == "opt") {
                          badge_info = "opt"
                       } else if (req == "req") {
                          badge_info = "req"
                       } else if (nilable == true) {
                          badge_info = "opt"
                       }
                       tooltip_text = badge_info == "opt" ? "Optional / Nilable" : ""
                       badge = " <a data-toggle=\"tooltip\" data-placement=\"top\" title=\""+tooltip_text+"\"><span class=\"glyphicon glyphicon-record arg_type_"+badge_info+" \" aria-hidden=\"true\"></span></a>"
                       vars.push("<dt>"+strip_quotes(var_name)+badge+"</dt>")
                        $.each ( var_info.types, function( key, var_type){
                           vars.push("<dd class=\"data_type\">"+strip_quotes(var_type)+"</dd>")
                        });
                    });
                    doc_items.push("<dl class=\"dl-horizontal\">"+vars.join("")+"</dl><div class=\"clear\"/>")
                }

                if (method_def.return_types && Object.keys(method_def.return_types).length > 0 ) {
                    vars = []
                    doc_items.push("<h4>Return Types</h3>")

                    var_name = "Return"
                    badge_info = "req"
                     
                    if (method_def.return_types.indexOf("NilClass") > -1) {
                        badge_info = "opt"
                    } 

                    tooltip_text = badge_info == "opt" ? "Nilable" : ""
                    badge = " <a data-toggle=\"tooltip\" data-placement=\"top\" title=\""+tooltip_text+"\"><span class=\"glyphicon glyphicon-record arg_type_"+badge_info+" \" aria-hidden=\"true\"></span></a>"
                    vars.push("<dt>"+strip_quotes(var_name)+badge+"</dt>")

                    $.each ( method_def.return_types, function( var_name, var_type){
                       vars.push("<dd class=\"data_type\">"+strip_quotes(var_type)+"</dd>")
                    });
                    doc_items.push("<dl class=\"dl-horizontal\">"+vars.join("")+"</dl><div class=\"clear\"/>")
                }


                if (method_def.local_vars && Object.keys(method_def.local_vars).length > 0 ) {
                    vars = []
                    doc_items.push("<h4>Local Variables</h3>")
                    $.each ( method_def.local_vars, function( var_name, var_info){

                       req = !var_info.arg_type ? "" : var_info.arg_type
                       nilable = !var_info.nilable ? false : var_info.nilable
                       badge_info = "req"
                       if (req == "opt") {
                          badge_info = "opt"
                       } else if (req == "req") {
                          badge_info = "req"
                       } else if (nilable == true) {
                          badge_info = "opt"
                       }
                       tooltip_text = badge_info == "opt" ? "Nilable" : ""
                       badge = " <a data-toggle=\"tooltip\" data-placement=\"top\" title=\""+tooltip_text+"\"><span class=\"glyphicon glyphicon-record arg_type_"+badge_info+" \" aria-hidden=\"true\"></span></a>"
                       vars.push("<dt>"+strip_quotes(var_name)+badge+"</dt>")

                        $.each ( var_info.types, function( key, var_type){
                           vars.push("<dd class=\"data_type\">"+strip_quotes(var_type)+"</dd>")
                        });
                    });
                    doc_items.push("<dl class=\"dl-horizontal\">"+vars.join("")+"</dl><div class=\"clear\"/>")
                }

            });

            toc_item = "<li><a href=\"#"+js_safe_class_name+"\">"+class_name+"</a><ul class=\"nav\">"+toc_items.join("")+"</ul></li>"
            body_item = "<div class=\"bs-docs-section\"><div class=\"page-header\"><h1 id=\""+js_safe_class_name+"\">"+class_name+"</h1></div>"+doc_items.join("")+"</div></div>"

            class_docs_toc.push(toc_item)
            class_docs_body.push(body_item)
            

          });
         
          $("#class_docs_toc").html(class_docs_toc.join( "" ))
          $("#class_docs_body").html(class_docs_body.join( "" ))
          $("#trace_info_data").html("<dl class=\"dl-horizontal\">"+trace_info_body.join( "" )+"</dl><div class=\"clear\"/>")

          $("#debug_info_data").html("<dl class=\"dl-horizontal\">" + debug_data.join( "" ) + "</dl>")

          // } else {
          //     $("#debug_info_tab").hide()
          // }

          //need to call this in here since loading json is asynchronous
          process_d3();

          $('[data-toggle="tooltip"]').tooltip()


        });
    }


function process_d3() {
    //need to fix scaling
    //http://stackoverflow.com/questions/9400615/whats-the-best-way-to-make-a-d3-js-visualisation-layout-responsive

    var width = 960,
        height = 2200;

    var cluster = d3.layout.cluster()
        .size([height, width - 400]);

    var diagonal = d3.svg.diagonal()
        .projection(function(d) {
            return [d.y, d.x];
        });

    var svg = d3.select("#d3classviz").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(150,0)");

        root = JSON.parse( JSON.stringify(d3json) );

        //if (error) throw error;

        var nodes = cluster.nodes(root),
            links = cluster.links(nodes);

        var link = svg.selectAll(".link")
            .data(links)
            .enter().append("path")
            .attr("class", function(d) { return "link" + (!d.source.type ? "" : " " + d.source.type) })
            .attr("d", diagonal);

        var node = svg.selectAll(".node")
            .data(nodes)
            .enter().append("g")
            .attr("class", function(d) { return "node" + (!d.type ? "" : " " + d.type) })
            .attr("transform", function(d) {
                return "translate(" + d.y + "," + d.x + ")";
            })

        node.append("circle")
            .attr("r", 4.5);

        node.append("text")
            .attr("dx", function(d) {
                return d.children ? -8 : 8;
            })
            .attr("dy", 3)
            .style("text-anchor", function(d) {
                return d.children ? "end" : "start";
            })
            .text(function(d) {
                return d.name;
            });

    d3.select(self.frameElement).style("height", height + "px");
}
