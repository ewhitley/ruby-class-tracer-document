
    //var json_path = "content/hqmf_export.json"
    var json_path = "content/SimpsonsProfile.json"
    
    var class_trace_debug = false

    if (class_trace_debug == true) {
        $("#debug_info_tab").removeClass("hide");
        $("#type_dependencies").removeClass("hide");
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

    //http://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
    function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

    function draw_var_info_row(var_name, var_info, context){

        vars = []

        req = !var_info.arg_type ? "" : var_info.arg_type
        nilable = !var_info.nilable ? false : var_info.nilable

        if (!nilable && var_info.types.indexOf("NilClass") > -1) {
          nilable = true
        }

        badges = []
        badges.push("")

        if (nilable) {
          tooltip_text = nilable == true ? "Nilable" : ""
          badge_info = "nil"
          badges.push(" <a data-toggle=\"tooltip\" data-placement=\"top\" title=\""+tooltip_text+"\"><span class=\"glyphicon glyphicon-record arg_type_"+badge_info+" \" aria-hidden=\"true\"></span></a>")
        }
        if (nilable && req == "opt") {
          tooltip_text = nilable == true ? "Optional" : ""
          badge_info = "opt"
          badges.push(" <a data-toggle=\"tooltip\" data-placement=\"top\" title=\""+tooltip_text+"\"><span class=\"glyphicon glyphicon-record arg_type_"+badge_info+" \" aria-hidden=\"true\"></span></a>")
        }

        vars.push("<div class=\"row var_content\">")
        vars.push("<div class=\"equalheight\">")
        vars.push("<div class=\"col-xs-4 col-md-3 var_data\">"+strip_quotes(var_name)+"</div>")
        vars.push("<div class=\"col-xs-2 col-md-1 text-center var_badges\">"+badges.join("")+"<br></div>") //don't judge me... ;)
        var_emit = []
        $.each ( var_info.types, function( key, var_type){
           css_label = "label-default"
           if (var_type == "NilClass") { css_label = "label-info" }
           var_emit.push("<span class=\"label label-vartype "+css_label+"\">"+strip_quotes(var_type)+"</span>")
        });
        vars.push("<div class=\"col-xs-12 col-md-8 var_type\">"+var_emit.join("")+"</div>")
        vars.push("</div>")
        vars.push("</div>")

        return vars.join("")

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

          times_method_called_all = data.times_method_called || 0

          $.each( data.classes, function( class_name, class_def ) {

            d3child = {}
            d3child.name = class_name
            d3child.type = "typeclass"
            d3child.size = times_method_called_all
            d3child.children = []
            $.each ( class_def.referenced_types, function( idx, var_type){
                if (var_type != class_name && all_class_names.indexOf(var_type) > -1) {
                    //don't show ones where we refere back to our own type
                    // also - filter to the types we sampled so we can just show those dependencies
                    var c = {}
                    c.name = strip_quotes(var_type)
                    c.type = "typeclass"
                    c.children = []
                    d3child.children.push(c)
                }
            });
            // $.each ( class_def.methods, function( method_name, method_def){
            //   var c = {}
            //   c.name = method_name
            //   c.type = "typemethod"
            //   c.size = method_def.times_method_called || 0
            //   d3child.children.push(c)
            // });

            d3json.children.push(d3child)

            // if (class_name != "HQMF2::Coded" & class_name != "HQMF::Attribute" & class_name != "HQMF2::Precondition") {
            //     return true
            // }
            // if (class_name != "HQMF2::Precondition") {
            //     return true
            // }

  
            js_safe_class_name = js_safe_name(class_name)

            toc_items = [];
            doc_items = [];

            var variable_header = "<div class=\"row var_head\"><div class=\"col-xs-4 col-md-3\">Name</div><div class=\"col-xs-2 col-md-1 text-center\">Options</div><div class=\"col-xs-12 col-md-8\">Type Details</div></div>"

            var total_times_called = 0
            var times_method_called_class = class_def.times_method_called || 0

            if (class_def.instance_vars && Object.keys(class_def.instance_vars).length > 0 ) {
                toc_link = js_safe_class_name + "-" + js_safe_name("instance_vars")
                toc_items.push("<li><a href=\"#"+toc_link+"\">Instance Variables</a></li>")   

                vars = []
                doc_items.push("<h3 id=\""+toc_link+"\">Instance Variables</h3>")
                $.each ( class_def.instance_vars, function( var_name, var_info){
                   vars.push(draw_var_info_row(var_name, var_info, "instance_vars"))
                });
                doc_items.push("<div class=\"container var_table\">"+variable_header + vars.join("")+"</div>")

            }
            $.each ( class_def.methods, function( method_name, method_def){

                js_safe_method_name = js_safe_name(method_name)

                toc_link = js_safe_class_name + "-" + js_safe_method_name
                toc_items.push("<li><a href=\"#"+toc_link+"\">"+method_name+"</a></li>")
                
                var method_title_block = ""
                //doc_items.push("<h3 id=\""+toc_link+"\">"+method_name+"</h3>")
                method_title = "<h3 id=\""+toc_link+"\">"+method_name+"</h3>"

                times_method_called = method_def.times_method_called
                method_stats = ""
                pct_called_class = 0
                pct_called_all = 0
                if (times_method_called_class > 0 && times_method_called_all > 0 ) {
                  pct_called_class = Math.round((times_method_called / times_method_called_class) * 100 )
                  pct_called_all = Math.round((times_method_called / times_method_called_all) * 100 )
                  method_stats = "<div class=\"stats_container\"><div><span class=\"stats_label\">Class</span><span>"+numberWithCommas(times_method_called)+" / "+numberWithCommas(times_method_called_class)+" ("+pct_called_class+"%)</span></div><div><span class=\"stats_label\">Total</span><span>"+numberWithCommas(times_method_called)+" / "+numberWithCommas(times_method_called_all)+" ("+pct_called_all+"%)</span></div></div><div class=\"clear\"/>"
                }


                //method_stats = "<div class=\"circliful_label\">Call Frequency</div><div class=\"circliful_container\" data-dimension=\"125\" data-text=\""+pct_called+"%\" data-info=\""+times_called+" / "+total_times_called+"\" data-width=\"10\" data-fontsize=\"14\" data-percent=\""+pct_called+"\" data-fgcolor=\"#7ea568\" data-bgcolor=\"#eee\" data-type=\"half\" data-fill=\"#ddd\"></div>"

                doc_items.push("<div><div class=\"method_title\">"+method_title+"</div>"+method_stats+"</div><div class=\"clear\"/>")

                if (method_def.calling_vars && Object.keys(method_def.calling_vars).length > 0 ) {
                    vars = []
                    doc_items.push("<h4>Calling Parameters</h3>")
                    $.each ( method_def.calling_vars, function( var_name, var_info){
                       vars.push(draw_var_info_row(var_name, var_info, "calling_vars"))
                    });
                    doc_items.push("<div class=\"container var_table\">"+variable_header + vars.join("")+"</div>")
                }

                if (method_def.return_types && Object.keys(method_def.return_types).length > 0 ) {
                    vars = []
                    var_name = "Return"
                    var_info = {}
                    var_info.types = method_def.return_types
                    doc_items.push("<h4>Return Types</h3>")
                    vars.push(draw_var_info_row(var_name, var_info, "return"))
                    doc_items.push("<div class=\"container var_table\">"+variable_header + vars.join("")+"</div>")
                }

                if (method_def.local_vars && Object.keys(method_def.local_vars).length > 0 ) {
                    vars = []
                    doc_items.push("<h4>Local Variables</h3>")
                    $.each ( method_def.local_vars, function( var_name, var_info){
                       vars.push(draw_var_info_row(var_name, var_info, "local_vars"))
                    });
                    doc_items.push("<div class=\"container var_table\">"+variable_header + vars.join("")+"</div>")
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

          //need to call this in here since loading json is asynchronous
          process_d3_tree();

          //this with the div height cheat = bad
          // should probably really just make everything tables...
          //$('[data-toggle="tooltip"]').tooltip()

          $( ".circliful_container" ).each(function() {
            $( this ).circliful();
          });

        });
    }


function process_d3_tree() {
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


    root = JSON.parse( JSON.stringify(d3json) )

    var svg = d3.select("#d3classviz").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(150,0)");

        var nodes = cluster.nodes(root);
        var links = cluster.links(nodes);

        var link = svg.selectAll(".link")
            // .data(links.filter(
            //   function(d){return d.target.type != "typemethod"})
            // )
            .data(links)
            .enter().append("path")
            .attr("class", function(d) { return "link" + (!d.source.type ? "" : " " + d.source.type) })
            .attr("d", diagonal);

        var node = svg.selectAll(".node")
            // .data(nodes.filter(
            //   function(d){return d.type != "typemethod"})
            // )
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
