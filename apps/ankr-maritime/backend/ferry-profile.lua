-- Mari8XOSRM Ferry Routing Profile
-- Based on OSRM lib/profiles/car.lua but adapted for maritime ferry routes

api_version = 4

Set = require('lib/set')
Sequence = require('lib/sequence')
Handlers = require("lib/way_handlers")
Relations = require("lib/relations")
find_access_tag = require("lib/access").find_access_tag
limit = require("lib/maxspeed").limit
Utils = require("lib/utils")
Measure = require("lib/measure")

function setup()
  return {
    properties = {
      u_turn_penalty                  = 0,     -- No U-turn penalty for ferries
      traffic_light_penalty           = 0,     -- No traffic lights at sea
      weight_name                     = 'duration',
      process_call_tagless_node       = false,
      max_speed_for_map_matching      = 80,    -- km/h (max ferry speed)
      use_turn_restrictions           = false,
      continue_straight_at_waypoint   = false,
      mode_change_penalty             = 0,
    },

    default_mode            = mode.ferry,
    default_speed           = 30,              -- 30 km/h (~16 knots) default ferry speed
    oneway_handling         = false,           -- Ferries can go both ways
    side_road_multiplier    = 1.0,
    turn_penalty            = 0,
    speed_reduction         = 1.0,
    turn_bias               = 1.0,
    cardinal_directions     = false,

    -- Allowed tags for ferry routes
    route_speeds = {
      ferry = 30,     -- Default ferry speed
      ship = 25,
    },

    -- Highway types (we tag our routes as "service")
    highway_speeds = {
      service = 30,
    },

    service_speeds = {},
    bridge_speeds = {},
    surface_speeds = {},

    -- We respect our custom tags
    route_tag_whitelist = Set {
      'route',
    },

    -- Penalties (all 0 for maritime)
    avoid = Set {},
    speeds = Sequence {},
    access_tag_whitelist = Set {},
    access_tag_blacklist = Set {},
    access_tags_hierarchy = Sequence {},

    restricted = Set {},
    construction_whitelist = Set {},
    barrier_whitelist = Set {},
  }
end

function process_node(profile, node, result)
  -- Accept all nodes (ports and waypoints)
  result.barrier = false
  result.traffic_lights = false
end

function process_way(profile, way, result)
  local data = {
    route = way:get_value_by_key('route'),
    highway = way:get_value_by_key('highway'),
    duration = tonumber(way:get_value_by_key('duration')),
    distance = tonumber(way:get_value_by_key('distance')),
    maxspeed = tonumber(way:get_value_by_key('maxspeed')),
    confidence = tonumber(way:get_value_by_key('confidence')),
    observations = tonumber(way:get_value_by_key('observations')),
  }

  -- Only accept ferry routes
  if data.route ~= 'ferry' then
    return
  end

  -- Calculate speed (prefer our custom maxspeed tag)
  local speed = profile.default_speed
  if data.maxspeed and data.maxspeed > 0 then
    speed = data.maxspeed
  end

  -- Weight calculation: prefer routes with higher confidence
  local confidence_factor = data.confidence or 0.5
  local weight_multiplier = 1.0

  -- Lower confidence = higher cost (slower effective speed)
  if confidence_factor < 0.5 then
    weight_multiplier = 1.5  -- 50% slower for low confidence routes
  elseif confidence_factor < 0.8 then
    weight_multiplier = 1.2  -- 20% slower for medium confidence
  end

  result.forward_speed = speed / weight_multiplier
  result.backward_speed = speed / weight_multiplier
  result.forward_mode = mode.ferry
  result.backward_mode = mode.ferry

  -- Calculate duration if we have it
  if data.duration and data.distance then
    result.duration = data.duration
    result.weight = data.duration * weight_multiplier
  end
end

function process_turn(profile, turn)
  -- No turn restrictions for ferries
  turn.duration = 0
  turn.weight = 0
end

return {
  setup = setup,
  process_way = process_way,
  process_node = process_node,
  process_turn = process_turn
}
