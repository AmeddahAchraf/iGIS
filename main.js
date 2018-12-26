class Layer{
    constructor(name, type){
        this.name = name ;
        this.type = type ;
    }

    static addLayer(layer){
        let element = `
        <div class="layer-item d-flex rounded  no-gutters bg-light  my-1 p-1 px-2 ">
        <div class="name col">${layer.name}</div>
        <div class="layer-actions ">
          <img id="toggle-attribute-table" src="./icons/table.png" alt="" srcset="">
          <img src="./icons/visibility.png" alt="" srcset="">
          <img src="./icons/clear-button.png" class="remove-layer" alt="" srcset="">
        </div>
      </div>
      `
      $(".layers-items").append(element);
    }

    static showInitPanel(){
        $(".attribute-table-wrapper").hide() ;
        initLayer.slideDown(400) ;
    }

    static hideInitPanel(){
        initLayer.slideUp(400) ;
    }
}
Layer.POLYGON = 0;
Layer.POLYLINE = 1 ;
Layer.POINT = 2 ;

class AttributeTable{
    constructor(layer){
        this.layer = layer ;
    }
    static addAttribute(attibute){
        let element = `
        <th scope="col">${attibute.name}</th>
        `
        $("#attribute-table thead tr:first").append(element);
        $("#attribute-table tbody tr").append("<td></td>");
    }

    static showAddPanel(){
    }

    static hideAddPanel(){
    }

}


$("#add-layer").click(()=>{
    Layer.showInitPanel()
})
$(".header").addClass("d-ndone")
let initLayer = $("#init-layer").hide();

$("button#close-init-layer").click(function(){
    Layer.hideInitPanel()
})

$("button#close-attributes-table").click(function(){
    $(".attribute-table-wrapper").slideToggle(400) ;
})

$("button#close-add-attribute").click(function(){
    let target = $(this).attr("data-target");
    $(target).slideUp(400) ;
})

$("#show-add-attribute").click(function(){
    let target = $(this).attr("data-target");
    $("#add-attribute").slideDown(400) ;
})


$("#layer-name").change(function(){
    $(this).val(this.value.trim())
})

$("#btn-save-layer").click(function(event){
    let name = $("#layer-name").val();
    if(name)event.preventDefault();
    else return ;
    let type = $("#layer-type").val().trim() ;
    let layer = new Layer(name, type) ;
    Layer.addLayer(layer);
    $("#add-layer-form").trigger("reset");
    $("button#close-init-layer").click();
})

$("#btn-save-attribute").click(function(event){
    let name = $("input[name=attribute-name]").val();
    if(name)event.preventDefault();
    else return ;
    let type = $("select[name=attribute-type]").val();
    let size = $("input[name=attribute-size]").val();
    AttributeTable.addAttribute({name, type, size}) ;
    $("#add-attribute-form").trigger("reset");
    $("button#close-add-attribute").click();
})

$(document).on("click", ".remove-layer", function(){
    $(this).parent().parent().slideUp(200, function(){
        $(this).remove()
    })
});

$(document).on("click", "#toggle-attribute-table", function(){
    $(".attribute-table-wrapper").slideToggle(400) ;

})